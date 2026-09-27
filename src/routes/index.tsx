import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteLock } from "@/hooks/use-site-lock";
import { LockedScreen } from "@/components/locked-screen";
import { SiteHeader } from "@/components/site-header";
import { VideoCard } from "@/components/video-card";
import { BackgroundRidges } from "@/components/background-ridges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marcell's Video Editor Portfolio — Selected Work" },
      {
        name: "description",
        content:
          "Selected video editing work — short films, commercials and documentary.",
      },
    ],
  }),
  component: HomePage,
});

interface Video {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  category: string | null;
}

function HomePage() {
  const isLocked = useSiteLock();
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("videos")
      .select("id,title,description,youtube_url,category")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setVideos(data ?? []));
  }, []);

  // Extract unique categories from videos
  const uniqueCategories = useMemo(() => {
    if (!videos) return [];
    const categories = new Set<string>();
    videos.forEach((v) => {
      if (v.category && v.category.trim()) {
        categories.add(v.category.trim());
      }
    });
    return Array.from(categories).sort();
  }, [videos]);

  // Filter videos by selected category
  const filteredVideos = useMemo(() => {
    if (!videos) return null;
    if (!selectedCategory) return videos;
    return videos.filter((v) => v.category === selectedCategory);
  }, [videos, selectedCategory]);

  if (isLocked) return <LockedScreen />;

  return (
    <main className="min-h-dvh bg-background relative">
      {/* Background Glowing Ridges: strictly behind hero and filter tags */}
      <BackgroundRidges className="absolute inset-x-0 top-0 h-[880px] lg:h-[950px] z-0" />

      <SiteHeader />

      <section className="relative pt-40 pb-16 px-6 text-center overflow-hidden z-10">
        {/* Soft radial scrim to enhance text legibility over moving waves */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10"
        >
          <div className="w-[740px] max-w-full h-[440px] rounded-full bg-background/55 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl animate-fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-6 drop-shadow-sm font-medium">
            VIDEO EDITOR • PORTFOLIO
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight text-foreground text-balance leading-[1.05] drop-shadow-md">
            Versatile editing for any screen.
          </h1>
          <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            A showcase of my work across multiple styles. I make diverse video edits. From slow, emotionally driven proposal films to high-octane Hungaroring track edits and fast-paced commercials. Whether it's scroll-stopping social media content or polished talking heads with clean motion graphics, I bring your footage to life.
          </p>
        </div>
      </section>

      {/* Category Filter Bar */}
      {uniqueCategories.length > 0 && (
        <section className="px-6 pb-12 relative z-10" aria-label="Filter works by category">
          <div className="mx-auto max-w-7xl flex flex-col items-center gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? "bg-white text-black"
                  : "glass text-foreground/80 hover:text-foreground hover:bg-white/10"
              }`}
            >
              All
            </button>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {uniqueCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-white text-black"
                      : "glass text-foreground/80 hover:text-foreground hover:bg-white/10"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video Grid Section: rests cleanly on original site background */}
      <section className="px-6 pb-32 relative z-10" aria-labelledby="selected-work-heading">
        <h2 id="selected-work-heading" className="sr-only">
          Selected Works
        </h2>
        <div className="mx-auto max-w-7xl">
          {filteredVideos === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl overflow-hidden bg-card/50 border border-border/40 animate-pulse"
                >
                  <div className="aspect-video bg-secondary/60" />
                  <div className="p-6 md:p-7 space-y-3">
                    <div className="h-7 w-3/4 bg-secondary/70 rounded-md" />
                    <div className="h-4 w-full bg-secondary/40 rounded-md" />
                    <div className="h-4 w-1/2 bg-secondary/40 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              {selectedCategory
                ? "No projects in this category yet."
                : "No projects to show yet."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredVideos.map((v, i) => (
                <VideoCard
                  key={v.id}
                  title={v.title}
                  description={v.description}
                  youtubeUrl={v.youtube_url}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 px-6 relative z-10">
        <div className="mx-auto max-w-7xl flex justify-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} — All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
