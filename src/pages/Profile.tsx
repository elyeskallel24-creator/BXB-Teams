import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { LogOut } from 'lucide-react';

export default function Profile() {
  const { profile } = useAuth();

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-smooth">
      <h1 className="page-title">Profile</h1>
      <div className="card flex flex-col items-center text-center space-y-4 py-10">
        <img src={profile?.avatar_url} alt="You" className="w-24 h-24 rounded-full object-cover bg-gray-200 shadow-soft" />
        <div>
          <h2 className="text-2xl font-bold">{profile?.username}</h2>
          <p className="text-text-secondaryLight dark:text-text-secondaryDark mt-1">ID: {profile?.user_id_code}</p>
          <span className="inline-block mt-3 text-xs font-bold px-3 py-1 rounded-md bg-brand-primary/10 text-brand-primary uppercase tracking-widest">
            {profile?.role}
          </span>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="btn-secondary mt-6 text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/30">
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
