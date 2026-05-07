import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

type AiSettings = {
  id?: string;
  provider: string;
  api_key: string;
  base_url: string;
  model: string;
  enabled: boolean;
};

const DEFAULTS: AiSettings = {
  provider: "lovable",
  api_key: "",
  base_url: "",
  model: "google/gemini-3-flash-preview",
  enabled: true,
};

const PROVIDER_PRESETS: Record<string, { base_url: string; placeholder_model: string }> = {
  lovable: { base_url: "", placeholder_model: "google/gemini-3-flash-preview" },
  openai: { base_url: "https://api.openai.com/v1", placeholder_model: "gpt-4o-mini" },
  openrouter: { base_url: "https://openrouter.ai/api/v1", placeholder_model: "google/gemini-flash-1.5" },
  groq: { base_url: "https://api.groq.com/openai/v1", placeholder_model: "llama-3.1-70b-versatile" },
  custom: { base_url: "", placeholder_model: "model-id" },
};

export default function AiSettingsEditor() {
  const qc = useQueryClient();
  const [form, setForm] = useState<AiSettings>(DEFAULTS);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("ai_settings").select("*").maybeSingle();
      if (error) throw error;
      return data as AiSettings | null;
    },
  });

  useEffect(() => { if (data) setForm({ ...DEFAULTS, ...data }); }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      if (form.id) {
        const { error } = await (supabase as any).from("ai_settings").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { id: _, ...rest } = payload as any;
        const { error } = await (supabase as any).from("ai_settings").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-settings"] }); toast.success("AI settings saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const setProvider = (p: string) => {
    const preset = PROVIDER_PRESETS[p] || PROVIDER_PRESETS.custom;
    setForm((f) => ({ ...f, provider: p, base_url: f.base_url || preset.base_url }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Assistant</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose which AI provider powers the blog editor's writing assistant. Defaults to Lovable AI (no key required).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provider Settings</CardTitle>
          <CardDescription>API key is stored encrypted in your database and only readable by admins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="text-sm">Enable AI features</Label>
                  <p className="text-xs text-muted-foreground">Turn off to hide all AI buttons in the blog editor.</p>
                </div>
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
              </div>

              <div>
                <Label className="text-xs">Provider</Label>
                <Select value={form.provider} onValueChange={setProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lovable">Lovable AI (default, no key needed)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="groq">Groq</SelectItem>
                    <SelectItem value="custom">Custom (OpenAI-compatible)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.provider !== "lovable" && (
                <>
                  <div>
                    <Label className="text-xs">API Base URL</Label>
                    <Input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.example.com/v1" />
                  </div>
                  <div>
                    <Label className="text-xs">API Key</Label>
                    <Input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="sk-…" />
                    <p className="text-[10px] text-muted-foreground mt-1">Used only by your blog editor. Never exposed to the public site.</p>
                  </div>
                </>
              )}

              <div>
                <Label className="text-xs">Model</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder={PROVIDER_PRESETS[form.provider]?.placeholder_model} />
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