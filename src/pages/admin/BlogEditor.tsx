import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar as CalendarIcon, Sparkles, Loader2, History, Maximize2, Minimize2, Smartphone, Monitor } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { RichTextEditor } from "@/components/RichTextEditor";
import { BlogSeoAnalyzer } from "@/components/BlogSeoAnalyzer";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn as cnUtil } from "@/lib/utils";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string | null;
  tags: string[];
  published: boolean;
  published_at: string | null;
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  canonical_url: string;
  category_id: string | null;
};

const emptyPost: Omit<BlogPost, "id"> = {
  title: "", slug: "", content: "", excerpt: "",
  cover_image_url: null, tags: [], published: false, published_at: null,
  seo_title: "", meta_description: "", focus_keyword: "", canonical_url: "",
  category_id: null,
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function BlogEditor() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [tagsInput, setTagsInput] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ type: string; items: string[] } | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showRevisions, setShowRevisions] = useState(false);
  const [restoredDraftPrompt, setRestoredDraftPrompt] = useState<null | (typeof emptyPost & { ts: number })>(null);
  const autosaveKey = editing ? `blog-draft:${editing.id}` : "blog-draft:new";
  const lastSavedRef = useRef<string>("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_categories").select("*").order("sort_order");
      if (error) throw error;
      return data as { id: string; name: string; color: string }[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Omit<BlogPost, "id"> & { id?: string }) => {
      const publishedAt = scheduledDate
        ? scheduledDate.toISOString()
        : p.published && !p.published_at
        ? new Date().toISOString()
        : p.published_at;

      const payload = { ...p, published_at: publishedAt };
      if (p.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { id: _, ...rest } = payload as any;
        const { error } = await supabase.from("blog_posts").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-blog"] }); setOpen(false); toast.success("Post saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-blog"] }); toast.success("Post deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null); setForm(emptyPost); setTagsInput("");
    setScheduledDate(undefined); setAiSuggestions(null); setOpen(true);
    try {
      const raw = localStorage.getItem("blog-draft:new");
      if (raw) setRestoredDraftPrompt(JSON.parse(raw));
    } catch {}
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p); setForm(p); setTagsInput(p.tags.join(", "));
    setScheduledDate(p.published_at ? new Date(p.published_at) : undefined);
    setAiSuggestions(null); setOpen(true);
    try {
      const raw = localStorage.getItem(`blog-draft:${p.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.ts && parsed.title && JSON.stringify({ ...p }) !== JSON.stringify({ ...parsed, ts: undefined })) {
          setRestoredDraftPrompt(parsed);
        }
      }
    } catch {}
  };

  // Autosave to localStorage every 5s while dialog is open
  useEffect(() => {
    if (!open) return;
    const handle = setInterval(() => {
      try {
        const snap = JSON.stringify({ ...form, tagsInput, ts: Date.now() });
        if (snap !== lastSavedRef.current) {
          localStorage.setItem(autosaveKey, snap);
          lastSavedRef.current = snap;
        }
      } catch {}
    }, 5000);
    return () => clearInterval(handle);
  }, [open, form, tagsInput, autosaveKey]);

  const restoreDraft = () => {
    if (!restoredDraftPrompt) return;
    const { ts, ...rest } = restoredDraftPrompt as any;
    setForm({ ...emptyPost, ...rest });
    if (rest.tagsInput) setTagsInput(rest.tagsInput);
    setRestoredDraftPrompt(null);
    toast.success("Draft restored");
  };
  const discardDraft = () => {
    localStorage.removeItem(autosaveKey);
    setRestoredDraftPrompt(null);
  };

  // Revisions
  const { data: revisions = [] } = useQuery({
    queryKey: ["blog-revisions", editing?.id],
    enabled: !!editing?.id && showRevisions,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("blog_post_revisions")
        .select("*")
        .eq("post_id", editing!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },
  });

  const restoreRevision = (rev: any) => {
    setForm((f) => ({
      ...f,
      title: rev.title,
      content: rev.content,
      excerpt: rev.excerpt,
      meta_description: rev.meta_description,
      seo_title: rev.seo_title,
      focus_keyword: rev.focus_keyword,
      cover_image_url: rev.cover_image_url,
      tags: rev.tags || [],
    }));
    setTagsInput((rev.tags || []).join(", "));
    setShowRevisions(false);
    toast.success("Revision loaded — click Save to apply");
  };

  const handleSave = () => {
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const slug = form.slug || slugify(form.title);
    save.mutate({ ...form, tags, slug, ...(editing ? { id: editing.id } : {}) }, {
      onSuccess: async () => {
        // Snapshot a revision for existing posts
        if (editing?.id) {
          try {
            await (supabase as any).from("blog_post_revisions").insert({
              post_id: editing.id,
              title: form.title, content: form.content, excerpt: form.excerpt,
              meta_description: form.meta_description, seo_title: form.seo_title,
              focus_keyword: form.focus_keyword, cover_image_url: form.cover_image_url,
              tags,
            });
          } catch (e) { console.warn("revision snapshot failed", e); }
        }
        try { localStorage.removeItem(autosaveKey); } catch {}
      },
    });
  };

  // AI helper
  const callAi = async (action: string) => {
    setAiLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("blog-ai", {
        body: {
          action,
          title: form.title,
          content: form.content,
          focusKeyword: form.focus_keyword,
          excerpt: form.excerpt,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (action === "generate-excerpt" && typeof data.result === "string") {
        setForm(f => ({ ...f, excerpt: data.result }));
        toast.success("Excerpt generated");
      } else if (Array.isArray(data.result)) {
        setAiSuggestions({ type: action, items: data.result });
      }
    } catch (e: any) {
      toast.error(e.message || "AI request failed");
    } finally {
      setAiLoading(null);
    }
  };

  const applySuggestion = (item: string) => {
    if (!aiSuggestions) return;
    switch (aiSuggestions.type) {
      case "suggest-title":
        setForm(f => ({ ...f, title: item, slug: f.slug || slugify(item) }));
        break;
      case "suggest-meta":
        setForm(f => ({ ...f, meta_description: item }));
        break;
      case "suggest-headings":
        // We don't auto-insert; user can copy
        navigator.clipboard.writeText(item);
        toast.success("Heading copied to clipboard");
        return;
      case "improve-content":
        navigator.clipboard.writeText(item);
        toast.success("Suggestion copied");
        return;
    }
    setAiSuggestions(null);
    toast.success("Applied!");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading font-bold">Blog Posts</h2>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> New Post</Button>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : posts.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No blog posts yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <Card key={p.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.published ? <Eye className="h-4 w-4 text-primary shrink-0" /> : <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <CardTitle className="text-sm truncate">{p.title}</CardTitle>
                    {p.published && <Badge variant="secondary" className="text-xs shrink-0">Published</Badge>}
                    {p.published_at && new Date(p.published_at) > new Date() && (
                      <Badge variant="outline" className="text-xs shrink-0 border-primary/40 text-primary">Scheduled</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cnUtil("max-h-[95vh] overflow-y-auto", focusMode ? "max-w-4xl" : "max-w-6xl")}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
              <div className="flex items-center gap-1">
                {editing && (
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setShowRevisions(true)} title="Revision history">
                    <History className="h-3.5 w-3.5" /> Revisions
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setPreviewMode(p => p === "mobile" ? "desktop" : "mobile")} title="Preview mode">
                  {previewMode === "mobile" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                  {previewMode === "mobile" ? "Desktop" : "Mobile"}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setFocusMode(f => !f)} title="Distraction-free mode">
                  {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  {focusMode ? "Exit focus" : "Focus"}
                </Button>
              </div>
            </div>
          </DialogHeader>

          {restoredDraftPrompt && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs">
              <span>📝 An unsaved draft was found from {new Date(restoredDraftPrompt.ts).toLocaleString()}.</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={discardDraft}>Discard</Button>
                <Button size="sm" onClick={restoreDraft}>Restore</Button>
              </div>
            </div>
          )}

          <div className={cnUtil("grid gap-6", focusMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[1fr_320px]", previewMode === "mobile" && "max-w-[420px] mx-auto")}>
            {/* Main editor area */}
            <div className="space-y-4 min-w-0">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated-from-title" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Excerpt</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1"
                        onClick={() => callAi("generate-excerpt")} disabled={!!aiLoading || !form.title}>
                        {aiLoading === "generate-excerpt" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        AI Generate
                      </Button>
                    </div>
                    <Textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Short summary for blog listing…" />
                  </div>

                  <div>
                    <Label>Content</Label>
                    <RichTextEditor content={form.content} onChange={val => setForm({ ...form, content: val })} placeholder="Start writing your blog post..." />
                  </div>

                  <ImagePicker value={form.cover_image_url} onChange={url => setForm({ ...form, cover_image_url: url })} label="Cover Image" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tags (comma-separated)</Label>
                      <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="microbiology, research, AMR" />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={form.category_id || ""} onValueChange={v => setForm({ ...form, category_id: v || null })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Schedule Publish Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch checked={form.published} onCheckedChange={v => setForm({ ...form, published: v })} />
                    <Label>Published</Label>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4 mt-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>SEO Title <span className="text-muted-foreground text-xs ml-1">({(form.seo_title || form.title).length}/60)</span></Label>
                    </div>
                    <Input value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })} placeholder={form.title || "Custom SEO title…"} maxLength={60} />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Leave blank to use blog title. Ideal: 50–60 chars.</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label>Meta Description <span className="text-muted-foreground text-xs ml-1">({form.meta_description.length}/160)</span></Label>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1"
                        onClick={() => callAi("suggest-meta")} disabled={!!aiLoading || !form.title}>
                        {aiLoading === "suggest-meta" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        AI Suggest
                      </Button>
                    </div>
                    <Textarea value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} rows={3} placeholder="120–150 chars for search results…" maxLength={160} />
                  </div>

                  <div>
                    <Label>Focus Keyword</Label>
                    <Input value={form.focus_keyword} onChange={e => setForm({ ...form, focus_keyword: e.target.value })} placeholder="e.g. antimicrobial resistance" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Used to analyze keyword placement across title, URL, content.</p>
                  </div>

                  <div>
                    <Label>Canonical URL</Label>
                    <Input value={form.canonical_url} onChange={e => setForm({ ...form, canonical_url: e.target.value })} placeholder="https://example.com/blog/original-post (optional)" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Set if this content was originally published elsewhere.</p>
                  </div>

                  {/* SERP Preview */}
                  <div className="rounded-lg border border-border/50 p-4 bg-muted/20">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">SERP Preview</p>
                    <div className="space-y-1">
                      <p className="text-primary text-base font-medium truncate">{form.seo_title || form.title || "Page Title"}</p>
                      <p className="text-xs text-green-400 truncate">yoursite.com/blog/{form.slug || "post-slug"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{form.meta_description || form.excerpt || "Meta description will appear here…"}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right sidebar: SEO Score + AI */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">SEO Analysis</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <BlogSeoAnalyzer data={{
                    title: form.title,
                    slug: form.slug,
                    content: form.content,
                    seoTitle: form.seo_title,
                    metaDescription: form.meta_description,
                    focusKeyword: form.focus_keyword,
                    excerpt: form.excerpt,
                    coverImageUrl: form.cover_image_url,
                  }} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-1.5"
                    onClick={() => callAi("suggest-title")} disabled={!!aiLoading || !form.title}>
                    {aiLoading === "suggest-title" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Suggest Titles
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-1.5"
                    onClick={() => callAi("suggest-headings")} disabled={!!aiLoading || !form.title}>
                    {aiLoading === "suggest-headings" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Suggest Headings
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-1.5"
                    onClick={() => callAi("improve-content")} disabled={!!aiLoading || !form.content}>
                    {aiLoading === "improve-content" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Content Suggestions
                  </Button>

                  {/* AI Suggestions List */}
                  {aiSuggestions && (
                    <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {aiSuggestions.type === "suggest-title" && "Title Suggestions"}
                        {aiSuggestions.type === "suggest-meta" && "Meta Descriptions"}
                        {aiSuggestions.type === "suggest-headings" && "Heading Ideas"}
                        {aiSuggestions.type === "improve-content" && "Improvements"}
                      </p>
                      {aiSuggestions.items.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => applySuggestion(item)}
                          className="w-full text-left text-xs p-2 rounded-md hover:bg-primary/10 border border-border/30 transition-colors"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revisions */}
      <Dialog open={showRevisions} onOpenChange={setShowRevisions}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Revision history</DialogTitle></DialogHeader>
          {revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No revisions yet. They are created on every save.</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {revisions.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title || "Untitled"}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => restoreRevision(r)}>Load</Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
