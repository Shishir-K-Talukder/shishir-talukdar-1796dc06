import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Github, ExternalLink } from "lucide-react";

export default function GithubSettings() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; owner?: string; repo?: string; branch?: string; repoInfo?: any; error?: string } | null>(null);

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
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your GitHub credentials are stored as encrypted server-side secrets:
            <code className="ml-1 font-mono text-xs">GITHUB_PAT</code>,{" "}
            <code className="font-mono text-xs">GITHUB_OWNER</code>,{" "}
            <code className="font-mono text-xs">GITHUB_REPO</code>,{" "}
            <code className="font-mono text-xs">GITHUB_BRANCH</code>.
          </p>

          <Button onClick={checkConfig} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Test Connection
          </Button>

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
              {!status.ok && <div className="mt-1 text-xs text-destructive">{status.error}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to update credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            For security, GitHub PAT and repo settings are stored as backend secrets and can only be edited from the Lovable Cloud secrets panel.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Generate a new fine-grained PAT at GitHub → Settings → Developer settings → Personal access tokens.</li>
            <li>Grant <strong>Contents: Read and write</strong> on the target repo only.</li>
            <li>Update the secret values in Lovable Cloud → Backend → Secrets.</li>
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