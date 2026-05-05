import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-region, x-retry-count",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const GH_API = "https://api.github.com";

function sanitizeOwner(v: string) {
  // Accept either "owner" or a URL like https://github.com/owner/repo
  const m = v.match(/github\.com\/([^/]+)/i);
  return (m ? m[1] : v).trim().replace(/^\/+|\/+$/g, "");
}
function sanitizeRepo(v: string) {
  const m = v.match(/github\.com\/[^/]+\/([^/?#]+)/i);
  return (m ? m[1] : v).trim().replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
}

async function loadConfig(admin: ReturnType<typeof createClient>) {
  const { data } = await admin.from("github_settings").select("*").limit(1).maybeSingle();
  const owner = sanitizeOwner(data?.owner || Deno.env.get("GITHUB_OWNER") || "");
  const repo = sanitizeRepo(data?.repo || Deno.env.get("GITHUB_REPO") || "");
  const branch = (data?.branch || Deno.env.get("GITHUB_BRANCH") || "main").trim();
  const pat = (data?.pat || Deno.env.get("GITHUB_PAT") || "").trim();
  return { row: data, owner, repo, branch, pat };
}

interface UploadBody {
  filename: string;       // e.g. "my-photo.jpg"
  contentBase64: string;  // base64 (no data: prefix)
  name?: string;          // display name for manifest
  alt?: string;
  category?: string;
}

interface GetConfigBody { action: "get-config" }
interface SaveConfigBody { action: "save-config"; owner: string; repo: string; branch?: string; pat?: string }
interface ConfigBody { action: "config" }
interface DeleteBody { action: "delete"; filename: string }

type Body = UploadBody | GetConfigBody | SaveConfigBody | ConfigBody | DeleteBody;

async function ghFetch(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 200,
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
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: callerRole, error: callerRoleError } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (callerRoleError) throw callerRoleError;
    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Only admins can manage GitHub settings" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const { row, pat: PAT, owner: OWNER, repo: REPO, branch: BRANCH } = await loadConfig(admin);

    if ("action" in body && body.action === "get-config") {
      return new Response(JSON.stringify({
        ok: true,
        owner: OWNER,
        repo: REPO,
        branch: BRANCH,
        hasPat: Boolean(PAT),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ("action" in body && body.action === "save-config") {
      const owner = sanitizeOwner(body.owner || "");
      const repo = sanitizeRepo(body.repo || "");
      const branch = (body.branch || "main").trim() || "main";
      const pat = (body.pat || "").trim();

      if (!owner || !repo) {
        return new Response(JSON.stringify({ error: "Owner and repository are required" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const existingPat = (row?.pat || Deno.env.get("GITHUB_PAT") || "").trim();
      if (!pat && !existingPat) {
        return new Response(JSON.stringify({ error: "Personal Access Token (PAT) is required the first time you save." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payload = {
        owner,
        repo,
        branch,
        pat: pat || existingPat,
        updated_at: new Date().toISOString(),
      };

      if (row?.id) {
        const { error } = await admin.from("github_settings").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await admin.from("github_settings").insert(payload);
        if (error) throw error;
      }

      return new Response(JSON.stringify({ ok: true, owner, repo, branch, hasPat: Boolean(payload.pat) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!PAT || !OWNER || !REPO) {
      return new Response(
        JSON.stringify({ ok: false, error: "GitHub settings missing. Set owner, repo and PAT in Admin → GitHub, then click Save Settings before testing." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Config check
    if ("action" in body && body.action === "config") {
      const r = await ghFetch(`/repos/${OWNER}/${REPO}`, PAT);
      const ok = r.ok;
      let errMsg: string | null = null;
      let info: any = null;
      if (ok) {
        info = await r.json();
      } else {
        const txt = await r.text();
        try { const j = JSON.parse(txt); errMsg = `${r.status} ${j.message || txt}`; }
        catch { errMsg = `${r.status} ${txt}`; }
      }
      // Always return 200 so the client sees the real GitHub error message
      return new Response(
        JSON.stringify({ ok, owner: OWNER, repo: REPO, branch: BRANCH, repoInfo: ok ? { full_name: info.full_name, private: info.private } : null, error: errMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper: read file contents from repo
    async function getFile(path: string): Promise<{ sha: string; content: string } | null> {
      const r = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, PAT);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`getFile ${path} failed: ${r.status} ${await r.text()}`);
      const j = await r.json();
      const decoded = atob((j.content || "").replace(/\n/g, ""));
      return { sha: j.sha, content: decoded };
    }

    async function putFile(path: string, contentBase64: string, message: string, sha?: string) {
      const r = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${path}`, PAT, {
        method: "PUT",
        body: JSON.stringify({ message, content: contentBase64, branch: BRANCH, sha }),
      });
      if (!r.ok) throw new Error(`putFile ${path} failed: ${r.status} ${await r.text()}`);
      return await r.json();
    }

    async function deleteFile(path: string, sha: string, message: string) {
      const r = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${path}`, PAT, {
        method: "DELETE",
        body: JSON.stringify({ message, sha, branch: BRANCH }),
      });
      if (!r.ok) throw new Error(`deleteFile ${path} failed: ${r.status} ${await r.text()}`);
    }

    // DELETE
    if ("action" in body && body.action === "delete") {
      const filename = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const imgPath = `public/uploads/${filename}`;
      const existing = await getFile(imgPath);
      if (existing) await deleteFile(imgPath, existing.sha, `chore(uploads): delete ${filename}`);

      const manifestPath = "public/uploads/manifest.json";
      const manifestFile = await getFile(manifestPath);
      if (manifestFile) {
        let manifest: { images: any[] } = { images: [] };
        try { manifest = JSON.parse(manifestFile.content); } catch { /* ignore */ }
        manifest.images = (manifest.images || []).filter((i: any) => i.file !== filename);
        const newContent = btoa(JSON.stringify(manifest, null, 2) + "\n");
        await putFile(manifestPath, newContent, `chore(uploads): remove ${filename} from manifest`, manifestFile.sha);
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // UPLOAD
    const upload = body as UploadBody;
    if (!upload.filename || !upload.contentBase64) {
      return new Response(JSON.stringify({ error: "filename and contentBase64 required" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const safeName = upload.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const imgPath = `public/uploads/${safeName}`;

    const existingImg = await getFile(imgPath);
    await putFile(imgPath, upload.contentBase64, `feat(uploads): add ${safeName}`, existingImg?.sha);

    // Update manifest
    const manifestPath = "public/uploads/manifest.json";
    const manifestFile = await getFile(manifestPath);
    let manifest: { images: any[] } = { images: [] };
    if (manifestFile) {
      try { manifest = JSON.parse(manifestFile.content); } catch { /* ignore */ }
    }
    manifest.images = manifest.images || [];
    const idx = manifest.images.findIndex((i: any) => i.file === safeName);
    const entry = {
      name: upload.name || safeName,
      file: safeName,
      alt: upload.alt || upload.name || safeName,
      category: upload.category || "general",
    };
    if (idx >= 0) manifest.images[idx] = entry; else manifest.images.unshift(entry);
    const newManifest = btoa(JSON.stringify(manifest, null, 2) + "\n");
    await putFile(manifestPath, newManifest, `chore(uploads): update manifest for ${safeName}`, manifestFile?.sha);

    return new Response(
      JSON.stringify({ ok: true, file: safeName, path: imgPath, url: `/uploads/${safeName}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("github-upload error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});