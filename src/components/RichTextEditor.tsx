import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3,
  Image as ImageIcon, Link as LinkIcon, Highlighter, Undo, Redo,
  Minus, RemoveFormatting, Table as TableIcon, Plus, Trash2,
} from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { ImagePicker } from "@/components/ImagePicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SHAPES: Record<string, { label: string; radius: string; aspect: string }> = {
  original:   { label: "Original",   radius: "0",     aspect: "auto" },
  square:     { label: "Square",     radius: "0.5rem",aspect: "1 / 1" },
  round:      { label: "Round",      radius: "9999px",aspect: "1 / 1" },
  oval:       { label: "Oval",       radius: "9999px",aspect: "16 / 10" },
  horizontal: { label: "Horizontal", radius: "0.75rem",aspect: "16 / 9" },
  vertical:   { label: "Vertical",   radius: "0.75rem",aspect: "3 / 4" },
  custom:     { label: "Custom",     radius: "0.5rem",aspect: "auto" },
};

// Extend image to support width, shape, aspect ratio attributes rendered as inline style
const SizedImage = ImageExt.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null, parseHTML: (el) => el.getAttribute("width") || el.style.width || null, renderHTML: (attrs) => attrs.width ? { width: attrs.width } : {} },
      "data-shape": { default: "original", parseHTML: (el) => el.getAttribute("data-shape") || "original", renderHTML: (attrs) => ({ "data-shape": attrs["data-shape"] || "original" }) },
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => attrs.style ? { style: attrs.style } : {},
      },
      alt: {
        default: "",
        parseHTML: (el) => el.getAttribute("alt") || "",
        renderHTML: (attrs) => ({ alt: attrs.alt || "" }),
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick, active, children, title, disabled,
}: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string; disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 shrink-0", active && "bg-primary/20 text-primary")}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-0.5 shrink-0" />;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [optsOpen, setOptsOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [shape, setShape] = useState<string>("original");
  const [width, setWidth] = useState<string>("100%");
  const [customAspect, setCustomAspect] = useState<string>("16 / 9");
  const [alt, setAlt] = useState<string>("");
  const [focal, setFocal] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      SizedImage.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer nofollow" } }),
      Placeholder.configure({ placeholder: placeholder || "Start writing your blog post..." }),
      Highlight.configure({ multicolor: false }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "blog-table" } }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[300px] px-4 py-3 focus:outline-none text-sm leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  const addImageFromUrl = useCallback(() => {
    const url = window.prompt("Image URL:");
    if (url) { setPendingUrl(url); setShape("original"); setWidth("100%"); setAlt(""); setFocal({ x: 50, y: 50 }); setOptsOpen(true); }
  }, []);

  const insertPickedImage = useCallback((url: string | null) => {
    if (!url) return;
    setPendingUrl(url); setShape("original"); setWidth("100%"); setAlt(""); setFocal({ x: 50, y: 50 }); setOptsOpen(true);
  }, []);

  const confirmInsertImage = () => {
    if (!editor || !pendingUrl) return;
    const cfg = SHAPES[shape] || SHAPES.original;
    const aspect = shape === "custom" ? customAspect : cfg.aspect;
    const styleParts: string[] = [];
    if (width) styleParts.push(`width:${width}`);
    if (aspect !== "auto") {
      styleParts.push(`aspect-ratio:${aspect}`);
      styleParts.push(`object-fit:cover`);
      styleParts.push(`object-position:${focal.x}% ${focal.y}%`);
      styleParts.push(`height:auto`);
    }
    if (cfg.radius && cfg.radius !== "0") styleParts.push(`border-radius:${cfg.radius}`);
    styleParts.push(`display:block`);
    styleParts.push(`max-width:100%`);
    const style = styleParts.join(";");
    editor.chain().focus().insertContent({
      type: "image",
      attrs: { src: pendingUrl, "data-shape": shape, style, width: width || null, alt },
    }).run();
    setOptsOpen(false);
    setPendingUrl(null);
  };

  const handleFocalDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 && e.type === "mousemove") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setFocal({ x: Math.round(x), y: Math.round(y) });
  };

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Link URL:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border bg-muted/30">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Table dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", editor.isActive("table") && "bg-primary/20 text-primary")} title="Table">
              <TableIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px]">
            <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
              <Plus className="h-4 w-4 mr-2" /> Insert 3×3 Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()}>
              <Plus className="h-4 w-4 mr-2" /> Insert 4×4 Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()}>
              Add Column After
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}>
              Add Row After
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()}>
              Delete Column
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()}>
              Delete Row
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Insert Image">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setPickerOpen(true)}>
              From Image Library / Repo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addImageFromUrl}>
              From URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
      <ImagePicker
        value={null}
        onChange={insertPickedImage}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        hideTrigger
      />

      <Dialog open={optsOpen} onOpenChange={setOptsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Image options</DialogTitle>
          </DialogHeader>
          {pendingUrl && (
            <div className="space-y-1">
              <div
                className="rounded-lg border border-border overflow-hidden bg-muted/30 p-3 flex justify-center cursor-crosshair select-none relative"
                onMouseDown={handleFocalDrag}
                onMouseMove={handleFocalDrag}
                title="Click or drag to set focal point"
              >
                <div className="relative" style={{ width: width || "100%", maxWidth: "100%" }}>
                  <img
                    src={pendingUrl}
                    alt={alt}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      aspectRatio: shape === "custom" ? customAspect : SHAPES[shape]?.aspect,
                      objectFit: (SHAPES[shape]?.aspect && SHAPES[shape].aspect !== "auto") || shape === "custom" ? "cover" : undefined,
                      objectPosition: `${focal.x}% ${focal.y}%`,
                      borderRadius: SHAPES[shape]?.radius,
                      height: "auto",
                      pointerEvents: "none",
                    }}
                  />
                  {((SHAPES[shape]?.aspect && SHAPES[shape].aspect !== "auto") || shape === "custom") && (
                    <div
                      className="absolute h-3 w-3 rounded-full bg-primary ring-2 ring-background pointer-events-none"
                      style={{ left: `calc(${focal.x}% - 6px)`, top: `calc(${focal.y}% - 6px)` }}
                    />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Drag inside preview to set focal point ({focal.x}%, {focal.y}%).</p>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Alt text (for SEO &amp; accessibility)</Label>
              <Textarea value={alt} onChange={(e) => setAlt(e.target.value)} rows={2} placeholder="Describe what's in the image" />
            </div>
            <div>
              <Label className="text-xs">Shape</Label>
              <Select value={shape} onValueChange={setShape}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SHAPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {shape === "custom" && (
              <div>
                <Label className="text-xs">Custom aspect ratio (e.g. 4 / 3, 21 / 9)</Label>
                <Input value={customAspect} onChange={(e) => setCustomAspect(e.target.value)} placeholder="16 / 9" />
              </div>
            )}
            <div>
              <Label className="text-xs">Width (px or %)</Label>
              <Input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="100% or 480px" />
              <p className="text-[10px] text-muted-foreground mt-1">Leave at 100% for responsive. Image will be cropped to the chosen shape.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOptsOpen(false)}>Cancel</Button>
            <Button type="button" onClick={confirmInsertImage}>Insert image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
