import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Session } from '@supabase/supabase-js';

type Profile = { id: string; username: string; role: string; avatar_url: string; user_id_code: string; team_id: string; };
type AuthContextType = { session: Session | null; profile: Profile | null; loading: boolean; };
const AuthContext = createContext<AuthContextType>({ session: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    async function fetchProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session!.user.id)
        .maybeSingle();

      if (error) console.error("Error fetching profile:", error.message);
      if (data) setProfile(data);
      setLoading(false);
    }

    fetchProfile();
  }, [session]);

  return <AuthContext.Provider value={{ session, profile, loading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
