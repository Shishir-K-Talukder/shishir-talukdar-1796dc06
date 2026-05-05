import { useEffect, useState } from "react";
import { useSiteContent, useUpsertContent } from "@/hooks/useSiteContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const fields = [
  { key: "google_scholar_url", label: "Google Scholar" },
  { key: "researchgate_url", label: "ResearchGate" },
  { key: "orcid_url", label: "ORCID" },
  { key: "linkedin_url", label: "LinkedIn" },
];

const defaults: Record<string, string> = {
  google_scholar_url: "https://scholar.google.com/",
  researchgate_url: "https://www.researchgate.net/",
  orcid_url: "https://orcid.org/",
  linkedin_url: "https://www.linkedin.com/",
};

export default function FooterProfilesEditor() {
  const { data, isLoading } = useSiteContent("footer");
  const upsert = useUpsertContent();
  const [form, setForm] = useState<Record<string, string>>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const next = { ...defaults };
    data.forEach((item) => {
      next[item.key] = item.value;
    });
    setForm(next);
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        fields.map((field) =>
          upsert.mutateAsync({
            section: "footer",
            key: field.key,
            value: form[field.key] || defaults[field.key],
          }),
        ),
      );
      toast.success("Footer academic profiles updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to save footer links");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold">Footer Academic Profiles</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update the academic profile links shown in the site footer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Links</CardTitle>
          <CardDescription>Use full URLs for each profile you want to show in the footer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs">{field.label}</Label>
                <Input
                  value={form[field.key] || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={defaults[field.key]}
                />
              </div>
            ))
          )}

          <Button onClick={handleSave} disabled={saving || isLoading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Footer Links
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}