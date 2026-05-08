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
import { Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
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
}

// Sortable video card component
function SortableVideoCard({ video, onEdit, onDelete }: { video: Video; onEdit: (video: Video) => void; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const id = extractYouTubeId(video.youtube_url);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl bg-card border border-border/60 overflow-hidden group"
    >
      <div className="relative aspect-video bg-secondary overflow-hidden">
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-2 cursor-grab active:cursor-grabbing hover:bg-background/90 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {id && (
          <img
            src={youtubeThumbnail(id)}
            alt={video.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
            }}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl text-foreground mb-1 truncate">
          {video.title}
        </h3>
        {video.category && (
          <span className="inline-block text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">
            {video.category}
          </span>
        )}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-8">
          {video.description || "—"}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => onEdit(video)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-destructive hover:text-destructive"
            onClick={() => onDelete(video.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [editing, setEditing] = useState<Video | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over || !videos) return;
    
    if (active.id !== over.id) {
      const oldIndex = videos.findIndex((item) => item.id === active.id);
      const newIndex = videos.findIndex((item) => item.id === over.id);
      
      const newVideos = arrayMove(videos, oldIndex, newIndex);
      
      // Update display_order for all videos in the database
      const updatePromises = newVideos.map((video, index) => 
        supabase
          .from('videos')
          .update({ display_order: index })
          .eq('id', video.id)
      );
      
      try {
        await Promise.all(updatePromises);
        setVideos(newVideos);
        toast.success('Order updated');
      } catch (error) {
        toast.error('Failed to update order');
        // Revert to original order
        setVideos(videos);
      }
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
    setVideos(data ?? []);
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl text-foreground">Work</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the projects shown on your portfolio.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="rounded-full">
          <Plus className="h-4 w-4 mr-2" />
          Add video
        </Button>
      </div>

      {videos === null ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 p-16 text-center">
          <p className="text-muted-foreground mb-4">No projects yet.</p>
          <Button onClick={() => setCreating(true)} variant="outline" className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Add your first video
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <SortableVideoCard
                  key={video.id}
                  video={video}
                  onEdit={setEditing}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          </SortableContext>
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

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
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
