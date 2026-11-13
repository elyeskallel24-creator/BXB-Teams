const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'context', 'AuthContext.tsx');

const content = `import { createContext, useContext, useEffect, useState, useMemo } from 'react';
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(prev => {
        if (prev && newSession && prev.user.id === newSession.user.id) {
          console.log('AuthContext: session ignored');
          return prev;
        }
        console.log('AuthContext: session changed');
        return newSession;
      });
      if (!newSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Added optional chaining to user and strict checks for "undefined"/"null" strings
    const userId = session?.user?.id;
    
    if (!userId || typeof userId !== 'string' || userId === 'undefined' || userId === 'null' || userId.trim() === '') {
      if (!session) setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error.message);
        } else if (data) {
          setProfile(prev => {
            if (prev?.id === data.id && prev?.username === data.username && prev?.role === data.role && prev?.avatar_url === data.avatar_url) {
              return prev;
            }
            return data;
          });
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [session?.user?.id]);

  const value = useMemo(() => ({ session, profile, loading }), [session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
`;

fs.writeFileSync(filePath, content);
console.log('Successfully fixed AuthContext.tsx. Restart your dev server.');