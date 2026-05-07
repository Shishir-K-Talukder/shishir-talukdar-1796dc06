import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { BarChart3, Save, Loader2, Info, Search } from "lucide-react";

export default function AnalyticsSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ga_measurement_id: "", gsc_verification: "", enabled: false });

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-settings-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("analytics_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) setForm({
      ga_measurement_id: data.ga_measurement_id || "",
      gsc_verification: data.gsc_verification || "",
      enabled: data.enabled,
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (data?.id) {
        const { error } = await supabase.from("analytics_settings").update(form).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("analytics_settings").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Analytics settings saved");
      qc.invalidateQueries({ queryKey: ["analytics-settings-admin"] });
      qc.invalidateQueries({ queryKey: ["analytics-settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold font-heading flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Google Integrations</h2>
        <p className="text-muted-foreground text-sm mt-1">Connect Google Analytics 4 and Search Console to your site.</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How to get your IDs</AlertTitle>
        <AlertDescription className="text-sm space-y-1">
          <div>• <strong>GA4:</strong> analytics.google.com → Admin → Data Streams → Web → copy <code className="font-mono">G-XXXXXXXXXX</code></div>
          <div>• <strong>Search Console:</strong> search.google.com/search-console → Add property → HTML tag method → copy the <code className="font-mono">content="..."</code> value only</div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Google Analytics 4</CardTitle>
          <CardDescription>Track visitors on shishirkumartalukder.com</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ga">Measurement ID</Label>
            <Input id="ga" placeholder="G-XXXXXXXXXX" value={form.ga_measurement_id} onChange={(e) => setForm({ ...form, ga_measurement_id: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="cursor-pointer">Enable tracking</Label>
              <p className="text-xs text-muted-foreground">Loads GA4 script and reports page views</p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-4 w-4" /> Search Console Verification</CardTitle>
          <CardDescription>Paste the content value from the meta-tag verification method</CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="abc123def456..." value={form.gsc_verification} onChange={(e) => setForm({ ...form, gsc_verification: e.target.value })} />
        </CardContent>
      </Card>

      <Button disabled={isLoading || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Settings
      </Button>
    </div>
  );
}