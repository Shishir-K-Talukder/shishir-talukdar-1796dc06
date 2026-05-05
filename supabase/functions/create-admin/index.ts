import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser(token);
    const callerId = userData?.user?.id;
    if (userError || !callerId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, role } = await req.json();
    if (!email || !password) throw new Error("Email and password required");
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRole = ["admin", "moderator", "editor", "user"].includes(role) ? role : "admin";

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: callerRole, error: callerRoleError } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (callerRoleError) throw callerRoleError;
    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Only admins can create users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: listedUsers, error: listError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) throw listError;

    const existingUser = listedUsers.users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    let userId = existingUser?.id;
    let action = "created";

    if (existingUser) {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
      });
      if (updateError) throw updateError;
      action = "updated";
    } else {
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      userId = newUser.user?.id;
    }

    if (!userId) throw new Error("Unable to resolve user id");

    const { data: existingRole, error: existingRoleError } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", normalizedRole)
      .maybeSingle();
    if (existingRoleError) throw existingRoleError;

    if (!existingRole) {
      const { error: roleErr } = await adminClient.from("user_roles").insert({
        user_id: userId,
        role: normalizedRole,
      });
      if (roleErr) throw roleErr;
    }

    return new Response(JSON.stringify({ success: true, user_id: userId, action, role: normalizedRole }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
