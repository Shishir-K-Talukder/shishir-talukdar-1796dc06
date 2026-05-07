import { useEffect, useState } from "react";
import { useSiteImages, useUploadImage, useDeleteImage } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Loader2, Image as ImageIcon, Github, RefreshCw, Copy } from "lucide-react";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionErrors";

const CATEGORIES = [
  { value: "profile", label: "Profile Picture" },
  { value: "hero", label: "Hero/Banner" },
  { value: "research", label: "Research" },
  { value: "general", label: "General" },
];

export default function ImageManager() {
  const { data: images, isLoading } = useSiteImages();
  const upload = useUploadImage();
  const deleteImg = useDeleteImage();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState("general");
  const [filterCategory, setFilterCategory] = useState("all");

  // GitHub repo media state
  const [ghFile, setGhFile] = useState<File | null>(null);
  const [ghName, setGhName] = useState("");
  const [ghAlt, setGhAlt] = useState("");
  const [ghCategory, setGhCategory] = useState("general");
  const [ghUploading, setGhUploading] = useState(false);
  const [repoImages, setRepoImages] = useState<Array<{ name: string; file: string; alt?: string; category?: string; url: string }>>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const projectUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

  const loadRepo = async () => {
    setRepoLoading(true);
    setRepoError(null);
    try {
      const { data, error } = await supabase.functions.invoke("github-upload", {
        body: { action: "list" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRepoImages(Array.isArray(data?.images) ? data.images : []);
    } catch (err: any) {
      setRepoError(await getEdgeFunctionErrorMessage({ error: err, functionName: "github-upload", projectUrl, response: err?.context instanceof Response ? err.context : undefined }));
    } finally {
      setRepoLoading(false);
    }
  };

  useEffect(() => { loadRepo(); }, []);

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleGithubUpload = async () => {
    if (!ghFile) return;
    setGhUploading(true);
    try {
      const safeName = (ghFile.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
      const contentBase64 = await fileToBase64(ghFile);
      const { data, error } = await supabase.functions.invoke("github-upload", {
        body: {
          filename: safeName,
          contentBase64,
          name: ghName || safeName,
          alt: ghAlt || ghName || safeName,
          category: ghCategory,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Pushed to GitHub", description: `${data.file} added. May take a minute to deploy.` });
      setGhFile(null); setGhName(""); setGhAlt("");
      setTimeout(loadRepo, 1500);
    } catch (err: any) {
      toast({ title: "GitHub upload failed", description: await getEdgeFunctionErrorMessage({ error: err, functionName: "github-upload", projectUrl, response: err?.context instanceof Response ? err.context : undefined }), variant: "destructive" });
    } finally {
      setGhUploading(false);
    }
  };

  const handleGithubDelete = async (filename: string) => {
    if (!confirm(`Delete "${filename}" from the GitHub repo?`)) return;
    setDeletingFile(filename);
    try {
      const { data, error } = await supabase.functions.invoke("github-upload", {
        body: { action: "delete", filename },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Deleted from GitHub", description: filename });
      setTimeout(loadRepo, 1500);
    } catch (err: any) {
      toast({ title: "Delete failed", description: await getEdgeFunctionErrorMessage({ error: err, functionName: "github-upload", projectUrl, response: err?.context instanceof Response ? err.context : undefined }), variant: "destructive" });
    } finally {
      setDeletingFile(null);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: url });
  };

  const handleUpload = async () => {
    if (!file || !name) {
      toast({ title: "Missing fields", description: "Provide a file and name.", variant: "destructive" });
      return;
    }
    try {
      await upload.mutateAsync({ file, name, altText, category });
      toast({ title: "Uploaded", description: `${name} uploaded successfully.` });
      setFile(null);
      setName("");
      setAltText("");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, url: string, imgName: string) => {
    if (!confirm(`Delete "${imgName}"?`)) return;
    try {
      await deleteImg.mutateAsync({ id, url });
      toast({ title: "Deleted", description: `${imgName} removed.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const filtered = filterCategory === "all" ? images : images?.filter((i) => i.category === filterCategory);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-heading font-bold">Image Manager</h2>

      <Tabs defaultValue="library" className="space-y-4">
        <TabsList>
          <TabsTrigger value="library">Image Library</TabsTrigger>
          <TabsTrigger value="github"><Github className="h-3.5 w-3.5 mr-1" /> GitHub Repo</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Image name" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Alt Text</Label>
            <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Descriptive alt text" />
          </div>
          <div>
            <Label>File</Label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={handleUpload} disabled={upload.isPending || !file}>
            {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            Upload
          </Button>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label>Filter:</Label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((img) => (
            <Card key={img.id} className="overflow-hidden group relative">
              <div className="aspect-square bg-muted">
                <img src={img.url} alt={img.alt_text || img.name} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{img.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{img.category}</p>
              </CardContent>
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => handleDelete(img.id, img.url, img.name)}
                disabled={deleteImg.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            No images uploaded yet.
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="github" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Github className="h-4 w-4" /> Push Media to GitHub</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Uploads to <code className="font-mono">public/uploads/</code> in your repo and updates <code className="font-mono">manifest.json</code>. Configure credentials in Admin → GitHub.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Display name</Label>
                  <Input value={ghName} onChange={(e) => setGhName(e.target.value)} placeholder="Optional friendly name" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={ghCategory} onValueChange={setGhCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Alt text</Label>
                <Input value={ghAlt} onChange={(e) => setGhAlt(e.target.value)} placeholder="Descriptive alt text" />
              </div>
              <div>
                <Label>File</Label>
                <Input type="file" accept="image/*" onChange={(e) => setGhFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={handleGithubUpload} disabled={ghUploading || !ghFile}>
                {ghUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Github className="h-4 w-4 mr-1" />}
                Push to GitHub
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h3 className="text-base font-heading font-semibold">Repo Media Library</h3>
            <Button variant="outline" size="sm" onClick={loadRepo} disabled={repoLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${repoLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {repoLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : repoError ? (
            <Card><CardContent className="p-6 text-center text-destructive text-sm">{repoError}</CardContent></Card>
          ) : repoImages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Github className="h-10 w-10 text-muted-foreground/50" />
                No images in the repo yet. Push one above.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {repoImages.map((img) => {
                const url = img.url;
                return (
                  <Card key={img.file} className="overflow-hidden group relative">
                    <div className="aspect-square bg-muted">
                      <img src={url} alt={img.alt || img.name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate">{img.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{img.category || "general"}</p>
                    </CardContent>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => copyUrl(url)} title="Copy URL">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => handleGithubDelete(img.file)}
                        disabled={deletingFile === img.file}
                        title="Delete from repo"
                      >
                        {deletingFile === img.file ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
