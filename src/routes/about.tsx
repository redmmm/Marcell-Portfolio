import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSiteLock } from "@/hooks/use-site-lock";
import { LockedScreen } from "@/components/locked-screen";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";

interface AboutContent {
  heading: string;
  body_paragraph_1: string;
  body_paragraph_2: string;
  contact_heading: string;
  contact_body: string;
  email: string;
}

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Marcell's Video Editor Portfolio" },
      {
        name: "description",
        content:
          "About the editor — experience, approach, and how to get in touch.",
      },
      { property: "og:title", content: "About — Marcell's Video Editor Portfolio" },
      {
        property: "og:description",
        content: "About the editor — experience, approach, and contact info.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const isLocked = useSiteLock();
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("page_content")
      .select("heading,body_paragraph_1,body_paragraph_2,contact_heading,contact_body,email")
      .eq("page", "about")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContent(data);
        setLoading(false);
      });
  }, []);

  if (isLocked === null || loading) return <div className="min-h-dvh bg-background" />;
  if (isLocked) return <LockedScreen />;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <section className="pt-40 pb-24 px-6">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-6">
            About
          </p>
          <h1 className="font-serif text-5xl md:text-6xl tracking-tight text-foreground text-balance leading-[1.05] mb-10">
            {content?.heading ?? "Versatility in every cut."}
          </h1>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>{content?.body_paragraph_1 ?? ""}</p>
            <p>{content?.body_paragraph_2 ?? ""}</p>
          </div>

          {/* Tools & Workflow */}
          <div className="mt-16 animate-fade-up">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-8 text-center">
              WORKFLOW & TOOLS
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* DaVinci Resolve */}
              <div className="group flex items-center gap-4 p-5 rounded-2xl glass hover:bg-white/[0.03] transition-all duration-500">
                <img
                  src="/davinci.png"
                  alt="DaVinci Resolve"
                  className="w-12 h-12 object-contain grayscale opacity-60 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                />
                <div>
                  <h3 className="text-sm font-medium text-foreground">DaVinci Resolve</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Primary editing, color, and finishing suite.</p>
                </div>
              </div>

              {/* Premiere Pro */}
              <div className="group flex items-center gap-4 p-5 rounded-2xl glass hover:bg-white/[0.03] transition-all duration-500">
                <img
                  src="/premiere.png"
                  alt="Premiere Pro"
                  className="w-12 h-12 object-contain grayscale opacity-60 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                />
                <div>
                  <h3 className="text-sm font-medium text-foreground">Premiere Pro</h3>
                  <p className="text-sm text-gray-400 mt-0.5">Extensive experience for versatile Adobe workflows.</p>
                </div>
              </div>

              {/* Generative AI */}
              <div className="group flex items-center gap-4 p-5 rounded-2xl glass hover:bg-white/[0.03] transition-all duration-500">
                <img
                  src="/ai-sparkle.png"
                  alt="Generative AI"
                  className="w-12 h-12 object-contain grayscale opacity-60 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                />
                <div>
                  <h3 className="text-sm font-medium text-foreground">Generative AI</h3>
                  <p className="text-sm text-gray-400 mt-0.5">I can also Integrate advanced AI tools to accelerate the creative process if needed.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 p-8 rounded-3xl glass shadow-elegant">
            <h2 className="font-serif text-2xl text-foreground mb-2">
              {content?.contact_heading ?? "Let's work together"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {content?.contact_body ?? "For project inquiries, rates, or just to say hello."}
            </p>
            <a
              href={`mailto:${content?.email ?? "red.edits2244@gmail.com"}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {content?.email ?? "red.edits2244@gmail.com"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
