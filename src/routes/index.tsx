import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteLock } from "@/hooks/use-site-lock";
import { LockedScreen } from "@/components/locked-screen";
import { SiteHeader } from "@/components/site-header";
import { VideoCard } from "@/components/video-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aperture — Selected Work" },
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
    if (isLocked) return;
    supabase
      .from("videos")
      .select("id,title,description,youtube_url,category")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setVideos(data ?? []));
  }, [isLocked]);

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

  if (isLocked === null) {
    return <div className="min-h-dvh bg-background" />;
  }

  if (isLocked) return <LockedScreen />;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <section className="relative pt-40 pb-16 px-6 text-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at top, oklch(78% 0.14 75 / 0.12), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-4xl animate-fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-6">
            VIDEO EDITOR • PORTFOLIO
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight text-foreground text-balance leading-[1.05]">
            Versatile editing for any screen.
          </h1>
          <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A showcase of my work across multiple styles. I make diverse video edits. From slow, emotionally driven proposal films to high-octane Hungaroring track edits and fast-paced commercials. Whether it's scroll-stopping social media content or polished talking heads with clean motion graphics, I bring your footage to life.
          </p>
        </div>
      </section>

      {/* Category Filter Bar */}
      {uniqueCategories.length > 0 && (
        <section className="px-6 pb-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center justify-center gap-2">
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

      <section className="px-6 pb-32">
        <div className="mx-auto max-w-7xl">
          {filteredVideos === null ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
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

      <footer className="border-t border-border/60 py-10 px-6">
        <div className="mx-auto max-w-7xl flex justify-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} — All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
