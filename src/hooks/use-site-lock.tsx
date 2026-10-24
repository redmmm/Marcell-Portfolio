import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns `{ isLocked, loading }`.
 * While loading is true, consumers should show nothing (or a blank screen)
 * to avoid flashing content before the lock status is known.
 */
export function useSiteLock() {
  const [isLocked, setIsLocked] = useState<boolean>(true); // assume locked until proven otherwise
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from("site_settings")
      .select("is_locked")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("[SiteLock] Error loading settings");
        }
        if (active) {
          setIsLocked(!!data?.is_locked);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { isLocked, loading };
}
