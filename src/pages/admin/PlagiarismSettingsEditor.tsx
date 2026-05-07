import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type Settings = {
  id?: string;
  provider: string;
  api_key: string;
  api_username: string;
  enabled: boolean;
};

const DEFAULTS: Settings = { provider: "copyscape", api_key: "", api_username: "", enabled: false };

export default function PlagiarismSettingsEditor() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Settings>(DEFAULTS);

  const { data, isLoading } = useQuery({
    queryKey: ["plagiarism-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("plagiarism_settings").select("*").maybeSingle();
      if (error) throw error;
      return data as Settings | null;
    },
  });

  useEffect(() => { if (data) setForm({ ...DEFAULTS, ...data }); }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      if (form.id) {
        const { error } = await (supabase as any).from("plagiarism_settings").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { id: _, ...rest } = payload as any;
        const { error } = await (supabase as any).from("plagiarism_settings").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plagiarism-settings"] }); toast.success("Plagiarism settings saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-primary" /> Plagiarism Check</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configure a 3rd-party plagiarism API. The "Check plagiarism" button in the blog editor will be enabled when a key is set.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provider Settings</CardTitle>
          <CardDescription>Get an API key from Copyscape, Winston AI, or another OpenAI-compatible plagiarism API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Enable plagiarism checking</Label>
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
              </div>
              <div>
                <Label className="text-xs">Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="copyscape">Copyscape</SelectItem>
                    <SelectItem value="winston">Winston AI</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">API Username (Copyscape only)</Label>
                <Input value={form.api_username} onChange={(e) => setForm({ ...form, api_username: e.target.value })} placeholder="your-username" />
              </div>
              <div>
                <Label className="text-xs">API Key</Label>
                <Input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="Paste API key" />
              </div>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}