import { useState } from "react";
import { Play, EyeOff } from "lucide-react";
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
  hidden?: boolean;
  index?: number;
}

export function VideoCard({ title, description, youtubeUrl, hidden = false, index = 0 }: VideoCardProps) {
  const [open, setOpen] = useState(false);
  const id = extractYouTubeId(youtubeUrl);

  if (!id) return null;

  // Hidden card — blank placeholder with "jelenleg nem elérhető"
  if (hidden) {
    return (
      <article
        className="animate-fade-up"
        style={{ animationDelay: `${index * 70}ms` }}
      >
        <div className="w-full rounded-3xl overflow-hidden bg-card/30 border border-border/30 transition-all duration-500">
          <div className="relative aspect-video overflow-hidden bg-secondary/20 flex items-center justify-center">
            {/* Subtle blurred background hint */}
            <div className="absolute inset-0 opacity-[0.07]">
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover blur-xl scale-110"
              />
            </div>
            <div className="relative flex flex-col items-center gap-3 text-center px-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30 border border-border/30">
                <EyeOff className="h-5 w-5 text-muted-foreground/50" />
              </span>
              <p className="text-sm font-medium text-muted-foreground/60 tracking-wide">
                jelenleg nem elérhető
              </p>
            </div>
          </div>
          <div className="p-6 md:p-7">
            <div className="h-7 w-3/4 bg-secondary/30 rounded-md mb-2" />
            <div className="h-4 w-1/2 bg-secondary/20 rounded-md" />
          </div>
        </div>
      </article>
    );
  }

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
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              srcSet={`https://i.ytimg.com/vi/${id}/mqdefault.jpg 320w, https://i.ytimg.com/vi/${id}/hqdefault.jpg 480w, https://i.ytimg.com/vi/${id}/maxresdefault.jpg 1280w`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
              alt=""
              aria-hidden="true"
              width={1280}
              height={720}
              loading={index < 2 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes("hqdefault")) {
                  target.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
                }
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
