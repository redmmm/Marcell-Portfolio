import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSiteLock() {
  const [isLocked, setIsLocked] = useState<boolean>(false);

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
        if (active && data?.is_locked) {
          setIsLocked(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return isLocked;
}
