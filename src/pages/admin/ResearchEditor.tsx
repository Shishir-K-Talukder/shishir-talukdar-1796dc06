import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { IconPicker } from "@/components/IconPicker";
import { toast } from "sonner";

type Project = {
  id: string;
  title: string;
  description: string;
  status: string;
  tags: string[];
  icon_name: string;
  image_url: string | null;
  sort_order: number;
};

const emptyProject: Omit<Project, "id"> = {
  title: "",
  description: "",
  status: "Ongoing",
  tags: [],
  icon_name: "FlaskConical",
  image_url: null,
  sort_order: 0,
};

export default function ResearchEditor() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [tagsInput, setTagsInput] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["admin-research"],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_projects").select("*").order("sort_order");
      if (error) throw error;
      return data as Project[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean) };
      if (editing) {
        const { error } = await supabase.from("research_projects").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("research_projects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-research"] });
      qc.invalidateQueries({ queryKey: ["home-counts"] });
      qc.invalidateQueries({ queryKey: ["research"] });
      toast.success(editing ? "Project updated" : "Project added");
      close();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("research_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-research"] });
      qc.invalidateQueries({ queryKey: ["home-counts"] });
      qc.invalidateQueries({ queryKey: ["research"] });
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  function openNew() {
    setEditing(null);
    const nextOrder = projects.length
      ? Math.max(...projects.map((p) => p.sort_order ?? 0)) + 1
      : 1;
    setForm({ ...emptyProject, sort_order: nextOrder });
    setTagsInput("");
    setOpen(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setForm({ title: p.title, description: p.description, status: p.status, tags: p.tags, icon_name: p.icon_name, image_url: p.image_url, sort_order: p.sort_order });
    setTagsInput(p.tags.join(", "));
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditing(null);
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold">Research Projects</h2>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {projects.map((p) => (
          <Card key={p.id} className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="truncate">{p.title}</span>
                <span className="text-xs font-mono text-muted-foreground ml-2 shrink-0">{p.status}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              <div className="flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <span key={t} className="text-xs rounded-full border px-2 py-0.5 bg-secondary/50 text-muted-foreground">{t}</span>
                ))}
              </div>
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
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Tags (comma-separated)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            <IconPicker value={form.icon_name} onChange={(name) => setForm({ ...form, icon_name: name })} />
            <ImagePicker value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Project Image" />
            <Input type="number" placeholder="Sort order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
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
