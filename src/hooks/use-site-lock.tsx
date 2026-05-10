import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSiteLock() {
  const [isLocked, setIsLocked] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("site_settings")
        .select("is_locked")
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("[SiteLock] Error loading settings");
      }
      // Site lock settings loaded
      if (active) setIsLocked(data?.is_locked ?? false);
    }
    load();

    const channel = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        (payload) => {
          const row = payload.new as { is_locked?: boolean } | undefined;
          if (row && typeof row.is_locked === "boolean") {
            setIsLocked(row.is_locked);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return isLocked;
}
