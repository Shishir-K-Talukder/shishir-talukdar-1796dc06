const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GH_API = "https://api.github.com";

interface UploadBody {
  filename: string;       // e.g. "my-photo.jpg"
  contentBase64: string;  // base64 (no data: prefix)
  name?: string;          // display name for manifest
  alt?: string;
  category?: string;
}

interface ConfigBody { action: "config" }
interface DeleteBody { action: "delete"; filename: string }

type Body = UploadBody | ConfigBody | DeleteBody;

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

  const PAT = Deno.env.get("GITHUB_PAT");
  const OWNER = Deno.env.get("GITHUB_OWNER");
  const REPO = Deno.env.get("GITHUB_REPO");
  const BRANCH = Deno.env.get("GITHUB_BRANCH") || "main";

  if (!PAT || !OWNER || !REPO) {
    return new Response(
      JSON.stringify({ error: "GitHub secrets missing. Set GITHUB_PAT, GITHUB_OWNER, GITHUB_REPO." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await req.json()) as Body;

    // Config check
    if ("action" in body && body.action === "config") {
      const r = await ghFetch(`/repos/${OWNER}/${REPO}`, PAT);
      const ok = r.ok;
      const data = ok ? await r.json() : await r.text();
      return new Response(
        JSON.stringify({ ok, owner: OWNER, repo: REPO, branch: BRANCH, repoInfo: ok ? { full_name: (data as any).full_name, private: (data as any).private } : null, error: ok ? null : data }),
        { status: ok ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      return new Response(JSON.stringify({ error: "filename and contentBase64 required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});