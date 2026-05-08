import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Subscribe FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          // Defer DB call to avoid deadlock
          setTimeout(() => checkAdmin(newSession.user.id), 0);
        } else {
          setIsAdmin(false);
        }
      },
    );

    // 2) Then load existing session
    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (error) {
        console.error("[Auth] getSession error:", error.message);
      }
      console.log("[Auth] Session loaded:", s?.user?.id ?? "no session");
      setSession(s);
      if (s?.user) {
        checkAdmin(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdmin(userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) {
      console.error("[Auth] checkAdmin error:", error.message);
    }
    console.log("[Auth] Admin check for", userId, ":", !!data);
    setIsAdmin(!!data);
  }

  return {
    user: session?.user ?? null,
    session,
    isAdmin,
    loading,
  };
}
