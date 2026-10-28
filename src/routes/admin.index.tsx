import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractYouTubeId, youtubeThumbnail } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

interface Video {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  display_order: number;
  category: string | null;
  hidden: boolean;
}

/* ─── Compact sortable row ─── */
function SortableVideoRow({
  video,
  index,
  onEdit,
  onDelete,
  onToggleHidden,
}: {
  video: Video;
  index: number;
  onEdit: (video: Video) => void;
  onDelete: (id: string) => void;
  onToggleHidden: (video: Video) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ytId = extractYouTubeId(video.youtube_url);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 px-3 py-2.5 rounded-xl border transition-all duration-150 ${
        isDragging
          ? "bg-secondary/80 border-primary/30 shadow-lg shadow-primary/5 scale-[1.01] z-50 relative"
          : video.hidden
            ? "bg-card/20 border-border/25 opacity-50 hover:opacity-80"
            : "bg-card/40 border-border/40 hover:bg-card/70 hover:border-border/60"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 -m-1 cursor-grab active:cursor-grabbing rounded-md text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Position number */}
      <span className="flex-shrink-0 w-5 text-xs tabular-nums text-muted-foreground/50 text-right">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <div className={`flex-shrink-0 w-16 h-10 rounded-md overflow-hidden bg-secondary/60 ${video.hidden ? "grayscale" : ""}`}>
        {ytId && (
          <img
            src={youtubeThumbnail(ytId)}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
            }}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Title + category + hidden badge */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate leading-tight ${video.hidden ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {video.title}
          </p>
          {video.category && (
            <span className="text-[11px] text-muted-foreground/70">
              {video.category}
            </span>
          )}
        </div>
        {video.hidden && (
          <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">
            Rejtett
          </span>
        )}
      </div>

      {/* Actions — visible on hover */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
        <button
          onClick={() => onToggleHidden(video)}
          className={`p-1.5 rounded-md transition-colors ${
            video.hidden
              ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
          title={video.hidden ? "Megjelenítés" : "Elrejtés"}
        >
          {video.hidden ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={() => onEdit(video)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(video.id)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Overlay shown while dragging ─── */
function DragOverlayRow({ video, index }: { video: Video; index: number }) {
  const ytId = extractYouTubeId(video.youtube_url);
  return (
    <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl border bg-card border-primary/40 shadow-xl shadow-primary/10 scale-[1.02]">
      <div className="flex-shrink-0 p-1 -m-1 text-muted-foreground/60">
        <GripVertical className="h-4 w-4" />
      </div>
      <span className="flex-shrink-0 w-5 text-xs tabular-nums text-muted-foreground/50 text-right">
        {index + 1}
      </span>
      <div className="flex-shrink-0 w-16 h-10 rounded-md overflow-hidden bg-secondary/60">
        {ytId && (
          <img
            src={youtubeThumbnail(ytId)}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
            }}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-tight">
          {video.title}
        </p>
        {video.category && (
          <span className="text-[11px] text-muted-foreground/70">
            {video.category}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main dashboard ─── */
function AdminDashboard() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [editing, setEditing] = useState<Video | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeVideo = activeId
    ? videos?.find((v) => v.id === activeId)
    : null;
  const activeIndex = activeId
    ? (videos?.findIndex((v) => v.id === activeId) ?? -1)
    : -1;

  const hiddenCount = videos?.filter((v) => v.hidden).length ?? 0;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;

    if (!over || !videos) return;

    if (active.id !== over.id) {
      const oldIndex = videos.findIndex((item) => item.id === active.id);
      const newIndex = videos.findIndex((item) => item.id === over.id);

      const newVideos = arrayMove(videos, oldIndex, newIndex);

      // Optimistic update
      setVideos(newVideos);

      const updatePromises = newVideos.map((video, index) =>
        supabase
          .from("videos")
          .update({ display_order: index })
          .eq("id", video.id)
      );

      try {
        await Promise.all(updatePromises);
        toast.success("Order updated");
      } catch (error) {
        toast.error("Failed to update order");
        setVideos(videos);
      }
    }
  }

  async function handleToggleHidden(video: Video) {
    const newHidden = !video.hidden;

    // Optimistic update
    setVideos(
      (prev) =>
        prev?.map((v) =>
          v.id === video.id ? { ...v, hidden: newHidden } : v
        ) ?? null
    );

    const { error } = await supabase
      .from("videos")
      .update({ hidden: newHidden })
      .eq("id", video.id);

    if (error) {
      if (
        error.message?.includes("hidden") ||
        error.code === "PGRST204" ||
        error.code === "42703" ||
        error.message?.includes("column")
      ) {
        toast.error(
          "A 'hidden' oszlop még nincs létrehozva a Supabase adatbázisban! Futtasd az SQL parancsot."
        );
      } else {
        toast.error(`Nem sikerült módosítani: ${error.message}`);
      }
      // Revert
      setVideos(
        (prev) =>
          prev?.map((v) =>
            v.id === video.id ? { ...v, hidden: !newHidden } : v
          ) ?? null
      );
    } else {
      toast.success(newHidden ? "Elrejtve" : "Megjelenítve");
    }
  }

  async function load() {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setVideos((data ?? []).map((v) => ({ ...v, hidden: v.hidden ?? false })));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("videos").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("Project deleted");
      setVideos((v) => v?.filter((x) => x.id !== deleteId) ?? null);
    }
    setDeleteId(null);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Work</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag to reorder · {videos?.length ?? 0} projects
            {hiddenCount > 0 && (
              <span className="text-amber-400/70"> · {hiddenCount} hidden</span>
            )}
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          size="sm"
          className="rounded-full h-8 px-4 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add video
        </Button>
      </div>

      {videos === null ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">No projects yet.</p>
          <Button
            onClick={() => setCreating(true)}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add your first video
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={videos.map((v) => v.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1">
              {videos.map((video, index) => (
                <SortableVideoRow
                  key={video.id}
                  video={video}
                  index={index}
                  onEdit={setEditing}
                  onDelete={setDeleteId}
                  onToggleHidden={handleToggleHidden}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeVideo ? (
              <DragOverlayRow video={activeVideo} index={activeIndex} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <VideoFormDialog
        open={creating}
        onOpenChange={setCreating}
        videos={videos || []}
        onSaved={() => {
          setCreating(false);
          load();
        }}
      />
      <VideoFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        video={editing}
        videos={videos || []}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the video from your portfolio. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Video form dialog (create / edit) ─── */
function VideoFormDialog({
  open,
  onOpenChange,
  video,
  videos,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  video?: Video | null;
  videos: Video[];
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [category, setCategory] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Get unique categories from existing videos
  const existingCategories = useMemo(() => {
    const categories = new Set<string>();
    videos.forEach((v) => {
      if (v.category && v.category.trim()) {
        categories.add(v.category.trim());
      }
    });
    return Array.from(categories).sort();
  }, [videos]);

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!category.trim()) return existingCategories;
    return existingCategories.filter((c: string) =>
      c.toLowerCase().includes(category.toLowerCase())
    );
  }, [category, existingCategories]);

  useEffect(() => {
    if (open) {
      setTitle(video?.title ?? "");
      setDescription(video?.description ?? "");
      setYoutubeUrl(video?.youtube_url ?? "");
      setCategory(video?.category ?? "");
      setShowSuggestions(false);
    }
  }, [open, video]);

  const previewId = extractYouTubeId(youtubeUrl);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = extractYouTubeId(youtubeUrl);
    if (!id) {
      toast.error("Please enter a valid YouTube URL.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 1000),
      youtube_url: youtubeUrl.trim(),
      category: category.trim() || null,
    };

    const { error } = video
      ? await supabase.from("videos").update(payload).eq("id", video.id)
      : await supabase.from("videos").insert(payload);

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(video ? "Project updated" : "Project added");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {video ? "Edit project" : "Add project"}
          </DialogTitle>
          <DialogDescription>
            Paste a YouTube URL — we'll auto-detect the video ID.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="youtube_url">YouTube URL</Label>
            <Input
              id="youtube_url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              required
              className="mt-1.5"
            />
            {youtubeUrl && !previewId && (
              <p className="text-xs text-destructive mt-1.5">
                Couldn't detect a YouTube ID from that URL.
              </p>
            )}
            {previewId && (
              <div className="mt-3 rounded-xl overflow-hidden border border-border/60 aspect-video bg-secondary">
                <img
                  src={youtubeThumbnail(previewId)}
                  alt="preview"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${previewId}/hqdefault.jpg`;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <div className="relative">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="e.g., Proposal Videos, Motion Graphics"
              maxLength={100}
              className="mt-1.5"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl bg-card border border-border/60 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {filteredSuggestions.map((suggestion: string) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setCategory(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="rounded-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {video ? "Save changes" : "Add project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
