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

type Collaboration = {
  id: string;
  institution: string;
  country: string;
  description: string;
  focus: string;
  sort_order: number;
  image_url: string | null;
};

const empty: Omit<Collaboration, "id"> = {
  institution: "", country: "", description: "", focus: "", sort_order: 0, image_url: null as string | null,
};

export default function CollaborationsEditor() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collaboration | null>(null);
  const [form, setForm] = useState(empty);

  const { data: collabs = [], isLoading } = useQuery({
    queryKey: ["admin-collaborations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("collaborations").select("*").order("sort_order");
      if (error) throw error;
      return data as Collaboration[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("collaborations").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("collaborations").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-collaborations"] });
      qc.invalidateQueries({ queryKey: ["home-counts"] });
      qc.invalidateQueries({ queryKey: ["collaborations"] });
      toast.success(editing ? "Collaboration updated" : "Collaboration added");
      close();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collaborations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-collaborations"] });
      qc.invalidateQueries({ queryKey: ["home-counts"] });
      qc.invalidateQueries({ queryKey: ["collaborations"] });
      toast.success("Collaboration deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(c: Collaboration) {
    setEditing(c);
    setForm({ institution: c.institution, country: c.country, description: c.description, focus: c.focus, sort_order: c.sort_order, image_url: (c as any).image_url || null });
    setOpen(true);
  }
  function close() { setOpen(false); setEditing(null); }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold">Collaborations</h2>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {collabs.map((c) => (
          <Card key={c.id} className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="truncate">{c.institution}</span>
                <span className="text-xs font-mono text-muted-foreground shrink-0">{c.country}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              <span className="text-xs font-mono rounded-full border bg-secondary/50 px-2 py-0.5 text-primary">{c.focus}</span>
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove.mutate(c.id)}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Collaboration" : "New Collaboration"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
            <Input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Focus area" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} />
            <Input type="number" placeholder="Sort order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            <ImagePicker value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Collaboration Image" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.institution || save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
