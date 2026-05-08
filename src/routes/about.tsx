import { createFileRoute } from "@tanstack/react-router";
import { useSiteLock } from "@/hooks/use-site-lock";
import { LockedScreen } from "@/components/locked-screen";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Aperture" },
      {
        name: "description",
        content:
          "About the editor — experience, approach, and how to get in touch.",
      },
      { property: "og:title", content: "About — Aperture" },
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
  if (isLocked === null) return <div className="min-h-dvh bg-background" />;
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
            Versatility in every cut.
          </h1>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              I'm Marcell, a freelance video editor with over 5 years of experience shaping visual stories. While my foundation was built in Premiere Pro, I now work primarily in DaVinci Resolve Studio, utilizing Fusion to integrate clean, dynamic motion graphics directly into the edit.
            </p>
            <p>
              My work covers a vast range of styles and formats. I've edited fast-paced supercar test drives at the Hungaroring in both standard and 360-degree video, crafted cinematic drone and social campaigns for travel agencies, and delivered fast-paced commercial ads. From emotional proposal films and long-form YouTube content to snappy short-form social media, POV footage, and polished talking heads, I adapt the pacing to fit the exact vibe of the project.
            </p>
          </div>

          <div className="mt-14 p-8 rounded-3xl glass shadow-elegant">
            <h2 className="font-serif text-2xl text-foreground mb-2">
              Let's work together
            </h2>
            <p className="text-muted-foreground mb-6">
              For project inquiries, rates, or just to say hello.
            </p>
            <a
              href="mailto:red.edits2244@gmail.com"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              red.edits2244@gmail.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
