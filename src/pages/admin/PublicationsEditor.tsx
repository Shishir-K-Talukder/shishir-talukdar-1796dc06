import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { toast } from "sonner";

type Publication = {
  id: string;
  title: string;
  journal: string;
  year: number;
  doi: string | null;
  abstract: string;
  topics: string[];
  sort_order: number;
  image_url: string | null;
};

const empty: Omit<Publication, "id"> = {
  title: "", journal: "", year: new Date().getFullYear(), doi: null, abstract: "", topics: [], sort_order: 0, image_url: null as string | null,
};

export default function PublicationsEditor() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Publication | null>(null);
  const [form, setForm] = useState(empty);
  const [topicsInput, setTopicsInput] = useState("");

  const { data: pubs = [], isLoading } = useQuery({
    queryKey: ["admin-publications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("publications").select("*").order("sort_order");
      if (error) throw error;
      return data as Publication[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, topics: topicsInput.split(",").map((t) => t.trim()).filter(Boolean) };
      if (editing) {
        const { error } = await supabase.from("publications").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("publications").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-publications"] });
      qc.invalidateQueries({ queryKey: ["home-counts"] });
      qc.invalidateQueries({ queryKey: ["publications"] });
      toast.success(editing ? "Publication updated" : "Publication added");
      close();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("publications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-publications"] });
      qc.invalidateQueries({ queryKey: ["home-counts"] });
      qc.invalidateQueries({ queryKey: ["publications"] });
      toast.success("Publication deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  function openNew() {
    setEditing(null);
    const nextOrder = pubs.length
      ? Math.max(...pubs.map((p) => p.sort_order ?? 0)) + 1
      : 1;
    setForm({ ...empty, sort_order: nextOrder });
    setTopicsInput("");
    setOpen(true);
  }
  function openEdit(p: Publication) {
    setEditing(p);
    setForm({ title: p.title, journal: p.journal, year: p.year, doi: p.doi, abstract: p.abstract, topics: p.topics, sort_order: p.sort_order, image_url: (p as any).image_url || null });
    setTopicsInput(p.topics.join(", "));
    setOpen(true);
  }
  function close() { setOpen(false); setEditing(null); }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold">Publications</h2>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      <div className="grid gap-3">
        {pubs.map((p) => (
          <Card key={p.id} className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="truncate">{p.title}</span>
                <span className="text-xs font-mono text-muted-foreground shrink-0">{p.year}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{p.journal}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{p.abstract}</p>
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove.mutate(p.id)}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Publication" : "New Publication"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Journal" value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} />
            <Input type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 2024 })} />
            <Input placeholder="DOI (optional)" value={form.doi || ""} onChange={(e) => setForm({ ...form, doi: e.target.value || null })} />
            <Textarea placeholder="Abstract" value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} />
            <Input placeholder="Topics (comma-separated)" value={topicsInput} onChange={(e) => setTopicsInput(e.target.value)} />
            <Input type="number" placeholder="Sort order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            <ImagePicker value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Publication Image" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.title || save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
