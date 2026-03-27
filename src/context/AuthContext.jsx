import { useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { supabase } from "../config/supabase";
import { AuthContext } from "./authContextStore";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setError(null);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", firebaseUser.uid)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!data) {
          await authService.upsertUserProfile(firebaseUser.uid, {
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "Google User",
          });

          const { data: createdProfile, error: createdProfileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", firebaseUser.uid)
            .maybeSingle();

          if (createdProfileError) {
            throw createdProfileError;
          }

          setProfile(createdProfile || null);
        } else {
          const shouldSyncName = !data.name && firebaseUser.displayName;
          const shouldSyncEmail = !data.email && firebaseUser.email;

          if (shouldSyncName || shouldSyncEmail) {
            await authService.upsertUserProfile(firebaseUser.uid, {
              email: data.email || firebaseUser.email || "",
              name: data.name || firebaseUser.displayName || "Google User",
            });

            const { data: refreshedProfile, error: refreshedProfileError } = await supabase
              .from("users")
              .select("*")
              .eq("id", firebaseUser.uid)
              .maybeSingle();

            if (refreshedProfileError) {
              throw refreshedProfileError;
            }

            setProfile(refreshedProfile || null);
          } else {
            setProfile(data);
          }
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, error, setProfile }),
    [user, profile, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
