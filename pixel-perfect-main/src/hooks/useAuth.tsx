import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isEngineer: boolean;
  roleLoaded: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  isEngineer: false,
  roleLoaded: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEngineer, setIsEngineer] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    const loadRole = (userId: string | undefined) => {
      if (!userId) {
        setIsEngineer(false);
        setRoleLoaded(true);
        return;
      }
      setTimeout(() => {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .then(({ data }) => {
            setIsEngineer(Boolean(data?.some((r) => r.role === "engineer")));
            setRoleLoaded(true);
          });
      }, 0);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      setRoleLoaded(false);
      loadRole(nextSession?.user?.id);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      loadRole(data.session?.user?.id);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsEngineer(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isEngineer,
        roleLoaded,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
