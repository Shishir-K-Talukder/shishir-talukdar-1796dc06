import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Github, ExternalLink, Save, Eye, EyeOff, Upload, Trash2, Copy, RefreshCw, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionErrors";

const CATEGORIES = [
  { value: "profile", label: "Profile" },
  { value: "hero", label: "Hero/Banner" },
  { value: "research", label: "Research" },
  { value: "blog", label: "Blog" },
  { value: "general", label: "General" },
];

export default function GithubSettings() {
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; owner?: string; repo?: string; branch?: string; repoInfo?: { full_name?: string; private?: boolean } | null; error?: string | null } | null>(null);
  const [showPat, setShowPat] = useState(false);
  const [form, setForm] = useState({ owner: "", repo: "", branch: "main", pat: "" });
  const [hasPat, setHasPat] = useState(false);

  // Repo media state
  const baseUrl = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const repoBase = `${baseUrl}/uploads`;
  const [ghFile, setGhFile] = useState<File | null>(null);
  const [ghName, setGhName] = useState("");
  const [ghAlt, setGhAlt] = useState("");
  const [ghCategory, setGhCategory] = useState("general");
  const [ghUploading, setGhUploading] = useState(false);
  const [repoImages, setRepoImages] = useState<Array<{ name: string; file: string; alt?: string; category?: string }>>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const projectUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

  const loadRepo = () => {
    setRepoLoading(true);
    setRepoError(null);
    fetch(`${repoBase}/manifest.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`Manifest not found (${r.status})`); return r.json(); })
      .then((data) => setRepoImages(Array.isArray(data?.images) ? data.images : []))
      .catch((err) => setRepoError(err.message))
      .finally(() => setRepoLoading(false));
  };

  useEffect(() => { loadRepo(); }, []);

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleGithubUpload = async () => {
    if (!ghFile) return;
    setGhUploading(true);
    try {
      const safeName = (ghFile.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
      const contentBase64 = await fileToBase64(ghFile);
      const { data, error } = await supabase.functions.invoke("github-upload", {
        body: { filename: safeName, contentBase64, name: ghName || safeName, alt: ghAlt || ghName || safeName, category: ghCategory },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Pushed ${data.file} to GitHub`);
      setGhFile(null); setGhName(""); setGhAlt("");
      setTimeout(loadRepo, 1500);
    } catch (err: any) {
      toast.error(await getEdgeFunctionErrorMessage({ error: err, functionName: "github-upload", projectUrl }));
    } finally { setGhUploading(false); }
  };

  const handleGithubDelete = async (filename: string) => {
    if (!confirm(`Delete "${filename}" from the GitHub repo?`)) return;
    setDeletingFile(filename);
    try {
      const { data, error } = await supabase.functions.invoke("github-upload", { body: { action: "delete", filename } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Deleted ${filename}`);
      setTimeout(loadRepo, 1500);
    } catch (err: any) {
      toast.error(await getEdgeFunctionErrorMessage({ error: err, functionName: "github-upload", projectUrl }));
    } finally { setDeletingFile(null); }
  };

  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); toast.success("URL copied"); };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("github-upload", {
          body: { action: "get-config" },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setForm({
          owner: data?.owner || "",
          repo: data?.repo || "",
          branch: data?.branch || "main",
          pat: "",
        });
        setHasPat(Boolean(data?.hasPat));
      } catch (err: any) {
        toast.error(await getEdgeFunctionErrorMessage({ error: err, functionName: "github-upload", projectUrl, response: err?.context instanceof Response ? err.context : undefined }));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("github-upload", {
        body: {
          action: "save-config",
          owner: form.owner,
          repo: form.repo,
          branch: form.branch,
          pat: form.pat,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setForm((prev) => ({ ...prev, pat: "" }));
      setHasPat(Boolean(data?.hasPat));
      setStatus(null);
      toast.success("GitHub settings saved");
    } catch (err: any) {
      toast.error(await getEdgeFunctionErrorMessage({ error: err, functionName: "github-upload", projectUrl, response: err?.context instanceof Response ? err.context : undefined }));
    } finally {
      setSaving(false);
    }
  };

  const checkConfig = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("github-upload", { body: { action: "config" } });
      if (error) throw error;
      setStatus(data);
      if (data.ok) toast.success("GitHub connection verified");
      else toast.error(data.error || "Check failed");
    } catch (err: any) {
      const message = await getEdgeFunctionErrorMessage({ error: err, functionName: "github-upload", projectUrl, response: err?.context instanceof Response ? err.context : undefined });
      setStatus({ ok: false, error: message });
      toast.error(message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-heading font-bold flex items-center gap-2"><Github className="h-5 w-5" /> GitHub Repo Integration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload images directly to your GitHub repo's <code className="font-mono text-xs">public/uploads/</code> folder and auto-update <code className="font-mono text-xs">manifest.json</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credentials</CardTitle>
          <CardDescription>Edit GitHub PAT and repo info here. Saved through your secure backend function.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Owner / Username</Label>
                  <Input
                    placeholder="Shishir-K-Talukder"
                    value={form.owner}
                    onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))}
                  />
                  <p className="text-[10px] text-muted-foreground">Just the username, not the full URL.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Repository</Label>
                  <Input
                    placeholder="shishir-talukdar"
                    value={form.repo}
                    onChange={(e) => setForm((p) => ({ ...p, repo: e.target.value }))}
                  />
                  <p className="text-[10px] text-muted-foreground">Just the repo name (no URL, no .git).</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Branch</Label>
                  <Input
                    placeholder="main"
                    value={form.branch}
                    onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Personal Access Token (PAT)</Label>
                  <div className="relative">
                    <Input
                      type={showPat ? "text" : "password"}
                      placeholder={hasPat ? "Saved token exists — paste a new token only to replace it" : "github_pat_..."}
                      value={form.pat}
                      onChange={(e) => setForm((p) => ({ ...p, pat: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPat(!showPat)}
                    >
                      {showPat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {hasPat ? "A token is already saved securely. Leave this blank to keep it." : "Paste a fine-grained token with Contents read/write permission."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Settings
                </Button>
                <Button variant="outline" onClick={checkConfig} disabled={checking}>
                  {checking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Test Connection
                </Button>
              </div>
            </>
          )}

          {status && (
            <div className={`rounded-lg border p-3 text-sm ${status.ok ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
              <div className="flex items-center gap-2 font-medium">
                {status.ok ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
                {status.ok ? "Connected" : "Failed"}
              </div>
              {status.ok && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground font-mono">
                  <div>Repo: {status.repoInfo?.full_name}</div>
                  <div>Branch: {status.branch}</div>
                  <div>Visibility: {status.repoInfo?.private ? "Private" : "Public"}</div>
                </div>
              )}
              {!status.ok && <div className="mt-1 text-xs text-destructive break-all">{status.error?.includes("Bad credentials") ? "GitHub token is invalid or expired. Generate a new fine-grained PAT with Contents read/write access, save it, then test again." : status.error}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to get a GitHub PAT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Open GitHub → Settings → Developer settings → <strong>Fine-grained personal access tokens</strong>.</li>
            <li>Repository access → <strong>Only select repositories</strong> → pick your portfolio repo.</li>
            <li>Permissions → Repository → set <strong>Contents: Read and write</strong>.</li>
            <li>Generate, copy the token (starts with <code className="font-mono text-xs">github_pat_</code>) and paste above.</li>
          </ol>
          <a
            href="https://github.com/settings/personal-access-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
          >
            Open GitHub PAT settings <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Push Media to GitHub</CardTitle>
          <CardDescription>Uploads to <code className="font-mono text-xs">public/uploads/</code> and updates <code className="font-mono text-xs">manifest.json</code>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Display name</Label>
              <Input value={ghName} onChange={(e) => setGhName(e.target.value)} placeholder="Optional friendly name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={ghCategory} onValueChange={setGhCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Alt text</Label>
            <Input value={ghAlt} onChange={(e) => setGhAlt(e.target.value)} placeholder="Descriptive alt text" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">File</Label>
            <Input type="file" accept="image/*" onChange={(e) => setGhFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={handleGithubUpload} disabled={ghUploading || !ghFile}>
            {ghUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Push to GitHub
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Repo Media Library</CardTitle>
            <CardDescription>Live from <code className="font-mono text-xs">public/uploads/manifest.json</code>.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadRepo} disabled={repoLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${repoLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {repoLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : repoError ? (
            <div className="text-sm text-destructive">{repoError}</div>
          ) : repoImages.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">No images in the repo yet. Push one above.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {repoImages.map((img) => {
                const url = `${repoBase}/${img.file}`;
                return (
                  <div key={img.file} className="relative group rounded-xl overflow-hidden border border-border bg-muted">
                    <div className="aspect-square">
                      <img src={url} alt={img.alt || img.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{img.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{img.category || "general"}</p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => copyUrl(url)} title="Copy URL">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => handleGithubDelete(img.file)} disabled={deletingFile === img.file} title="Delete">
                        {deletingFile === img.file ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}