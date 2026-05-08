import { useState } from "react";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  extractYouTubeId,
  youtubeThumbnail,
  youtubeEmbedUrl,
} from "@/lib/youtube";

interface VideoCardProps {
  title: string;
  description: string;
  youtubeUrl: string;
  index?: number;
}

export function VideoCard({ title, description, youtubeUrl, index = 0 }: VideoCardProps) {
  const [open, setOpen] = useState(false);
  const id = extractYouTubeId(youtubeUrl);

  if (!id) return null;

  return (
    <>
      <article
        className="group animate-fade-up"
        style={{ animationDelay: `${index * 70}ms` }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full text-left rounded-3xl overflow-hidden bg-card border border-border/60 hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 shadow-elegant"
        >
          <div className="relative aspect-video overflow-hidden bg-secondary">
            <img
              src={youtubeThumbnail(id)}
              alt={title}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
              }}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/0 to-background/0 opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full glass shadow-elegant transition-transform duration-300 group-hover:scale-110">
                <Play className="h-6 w-6 text-primary fill-primary ml-1" />
              </span>
            </div>
          </div>
          <div className="p-6 md:p-7">
            <h3 className="font-serif text-2xl md:text-3xl tracking-tight text-foreground mb-2">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </button>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl border-border/60 bg-card p-0 overflow-hidden rounded-3xl">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
          <div className="aspect-video bg-black">
            {open && (
              <iframe
                src={youtubeEmbedUrl(id)}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>
          <div className="p-6">
            <h3 className="font-serif text-2xl text-foreground mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
