import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Github, ExternalLink, Save, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function GithubSettings() {
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; owner?: string; repo?: string; branch?: string; repoInfo?: any; error?: string } | null>(null);
  const [showPat, setShowPat] = useState(false);
  const [form, setForm] = useState({ owner: "", repo: "", branch: "main", pat: "" });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["github-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("github_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        owner: settings.owner || "",
        repo: settings.repo || "",
        branch: settings.branch || "main",
        pat: settings.pat || "",
      });
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      // Strip URLs to bare names
      const owner = (form.owner.match(/github\.com\/([^/]+)/i)?.[1] || form.owner).replace(/^\/+|\/+$/g, "").trim();
      const repo = (form.repo.match(/github\.com\/[^/]+\/([^/?#]+)/i)?.[1] || form.repo).replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "").trim();
      const payload = { owner, repo, branch: form.branch.trim() || "main", pat: form.pat.trim(), updated_at: new Date().toISOString() };
      if (settings?.id) {
        const { error } = await supabase.from("github_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("github_settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("GitHub settings saved");
      qc.invalidateQueries({ queryKey: ["github-settings"] });
      setStatus(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkConfig = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("github-upload", { body: { action: "config" } });
      if (error) throw error;
      setStatus(data);
      if (data.ok) toast.success("GitHub connection verified");
      else toast.error(data.error || "Check failed");
    } catch (err: any) {
      setStatus({ ok: false, error: err.message });
      toast.error(err.message);
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
          <CardDescription>Edit GitHub PAT and repo info here. Saved to your secure backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
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
                      placeholder="github_pat_..."
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
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
              {!status.ok && <div className="mt-1 text-xs text-destructive break-all">{status.error}</div>}
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
    </div>
  );
}