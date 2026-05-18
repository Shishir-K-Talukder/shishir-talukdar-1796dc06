import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require an authenticated admin to prevent unauthenticated AI credit abuse.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await authClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, title, content, focusKeyword, excerpt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Load admin AI settings (provider/model/api key/base url) – fall back to Lovable AI.
    let provider = "lovable";
    let baseUrl = "https://ai.gateway.lovable.dev/v1";
    let model = "google/gemini-3-flash-preview";
    let apiKey = LOVABLE_API_KEY || "";
    try {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: cfg } = await admin.from("ai_settings").select("*").maybeSingle();
      if (cfg && cfg.enabled !== false) {
        provider = cfg.provider || "lovable";
        if (provider !== "lovable") {
          baseUrl = (cfg.base_url || baseUrl).replace(/\/$/, "");
          apiKey = cfg.api_key || apiKey;
        }
        if (cfg.model) model = cfg.model;
      }
    } catch (e) {
      console.warn("Failed to load ai_settings, using defaults", e);
    }
    if (!apiKey) throw new Error("No AI API key configured");

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "suggest-title":
        systemPrompt = "You are an SEO blog expert. Suggest 5 compelling, SEO-optimized blog title alternatives. Return a JSON array of strings.";
        userPrompt = `Current title: "${title}"\nFocus keyword: "${focusKeyword || 'none'}"\nContent excerpt: "${(content || "").slice(0, 500)}"`;
        break;
      case "suggest-meta":
        systemPrompt = "You are an SEO expert. Generate 3 meta descriptions (120-150 chars each) for the blog post. Return a JSON array of strings.";
        userPrompt = `Title: "${title}"\nFocus keyword: "${focusKeyword || 'none'}"\nExcerpt: "${excerpt || (content || "").slice(0, 300)}"`;
        break;
      case "suggest-headings":
        systemPrompt = "You are a blog content strategist. Suggest 5 H2 subheadings that would improve the blog post structure and SEO. Return a JSON array of strings.";
        userPrompt = `Title: "${title}"\nFocus keyword: "${focusKeyword || 'none'}"\nCurrent content: "${(content || "").slice(0, 1000)}"`;
        break;
      case "improve-content":
        systemPrompt = "You are a professional blog editor. Analyze the content and provide 3-5 specific, actionable improvement suggestions for readability, SEO, and engagement. Return a JSON array of strings.";
        userPrompt = `Title: "${title}"\nFocus keyword: "${focusKeyword || 'none'}"\nContent: "${(content || "").slice(0, 2000)}"`;
        break;
      case "generate-excerpt":
        systemPrompt = "You are a blog copywriter. Write a compelling excerpt/summary (2-3 sentences, under 200 chars) for the blog post. Return just the text, no JSON.";
        userPrompt = `Title: "${title}"\nContent: "${(content || "").slice(0, 1000)}"`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Try to parse as JSON array
    let result: any = text;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
    } catch {
      // Keep as text
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("blog-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
