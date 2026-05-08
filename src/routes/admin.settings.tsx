import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("id,is_locked")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        if (data) {
          setSettingsId(data.id);
          setIsLocked(data.is_locked);
        }
        setLoading(false);
      });
  }, []);

  async function toggle(next: boolean) {
    if (!settingsId) return;
    setSaving(true);
    const prev = isLocked;
    setIsLocked(next);
    const { error } = await supabase
      .from("site_settings")
      .update({ is_locked: next })
      .eq("id", settingsId);
    setSaving(false);
    if (error) {
      setIsLocked(prev);
      toast.error(error.message);
    } else {
      toast.success(next ? "Site is now locked" : "Site is live");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control public access to your portfolio.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-3xl bg-card border border-border/60 p-8 shadow-elegant">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <Label htmlFor="lock" className="font-serif text-xl text-foreground">
                Lock public site
              </Label>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                When enabled, visitors will see a minimalist locked screen
                instead of your portfolio and about page. Your admin dashboard
                remains accessible.
              </p>
            </div>
            <Switch
              id="lock"
              checked={isLocked}
              onCheckedChange={toggle}
              disabled={saving}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-border/60 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isLocked ? "bg-destructive" : "bg-primary"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="text-foreground">
                {isLocked ? "Locked" : "Live"}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
