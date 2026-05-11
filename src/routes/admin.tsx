import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LayoutGrid, Settings, FileText, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Allow /admin/login through without auth
  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (loading || isLoginRoute) return;
    if (!user || !isAdmin) {
      navigate({ to: "/admin/login" });
    }
  }, [loading, user, isAdmin, isLoginRoute, navigate]);

  if (isLoginRoute) return <Outlet />;

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/admin/login" });
  }

  const navItems = [
    { to: "/admin" as const, label: "Work", icon: LayoutGrid, exact: true },
    { to: "/admin/about" as const, label: "About", icon: FileText, exact: false },
    { to: "/admin/settings" as const, label: "Settings", icon: Settings, exact: false },
  ];

  return (
    <div className="min-h-dvh bg-background flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-border/60 bg-sidebar p-6">
        <Link to="/" className="font-serif text-2xl text-primary mb-10">
          Aperture
        </Link>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 pt-6 border-t border-border/60">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View site
          </a>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 glass border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-serif text-lg text-primary">Aperture</Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-1.5 text-xs rounded-full text-muted-foreground"
              activeProps={{ className: "px-3 py-1.5 text-xs rounded-full bg-secondary text-foreground" }}
              activeOptions={{ exact: item.exact }}
            >
              {item.label}
            </Link>
          ))}
          <Button size="sm" variant="ghost" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="flex-1 md:p-10 p-4 pt-20 md:pt-10">
        <Outlet />
      </main>
    </div>
  );
}
