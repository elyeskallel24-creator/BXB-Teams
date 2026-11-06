import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, UserCheck, Shield } from 'lucide-react';

type AllowedId = {
  id: string;
  user_id_code: string;
  role: string;
  is_used: boolean;
  created_at: string;
};

export default function Profile() {
  const { profile } = useAuth();
  const [allowedIds, setAllowedIds] = useState<AllowedId[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState('member');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (profile?.role === 'admin') fetchAllowedIds();
    else setLoading(false);
  }, [profile]);

  async function fetchAllowedIds() {
    const { data } = await supabase.from('allowed_user_ids').select('*').order('created_at', { ascending: false });
    if (data) setAllowedIds(data);
    setLoading(false);
  }

  async function generateId(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    
    const nextNumber = allowedIds.length > 0 
      ? Math.max(...allowedIds.map(id => parseInt(id.user_id_code.split('-')[1]) || 0)) + 1 
      : 1;
    const newCode = `SALES-${nextNumber.toString().padStart(4, '0')}`;

    const { error } = await supabase.from('allowed_user_ids').insert({
      team_id: profile?.team_id,
      user_id_code: newCode,
      role: newRole
    });

    if (!error) {
      fetchAllowedIds();
    }
    setIsGenerating(false);
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      
      <div className="bg-white dark:bg-brand-cardDark p-6 rounded-2xl shadow-sm border border-brand-borderLight dark:border-brand-borderDark flex items-center gap-4">
        <img src={profile?.avatar_url} alt="You" className="w-16 h-16 rounded-full object-cover bg-gray-200" />
        <div>
          <h2 className="text-xl font-bold text-brand-secondary dark:text-white">{profile?.username}</h2>
          <p className="text-sm text-gray-500">ID: {profile?.user_id_code}</p>
          <span className="inline-block mt-1 text-xs font-semibold px-2 py-1 rounded-md bg-brand-primary/10 text-brand-primary uppercase tracking-wide">
            {profile?.role}
          </span>
        </div>
      </div>

      {profile?.role === 'admin' && (
        <div className="bg-white dark:bg-brand-cardDark p-6 rounded-2xl shadow-sm border border-brand-borderLight dark:border-brand-borderDark space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-brand-secondary dark:text-white">
            <Shield size={20} className="text-brand-primary" /> Admin Tools: User IDs
          </h3>
          
          <form onSubmit={generateId} className="flex gap-2 items-center">
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="px-4 py-2 rounded-lg border border-brand-borderLight dark:border-brand-borderDark bg-transparent text-brand-secondary dark:text-white">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={isGenerating} className="bg-brand-primary text-brand-secondary px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-brand-accent transition">
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Generate ID
            </button>
          </form>

          <div className="space-y-2 mt-4">
            {allowedIds.map(id => (
              <div key={id.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-brand-borderLight dark:border-brand-borderDark">
                <div>
                  <p className="font-mono font-bold text-brand-secondary dark:text-white">{id.user_id_code}</p>
                  <p className="text-xs text-gray-500 uppercase">{id.role}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${id.is_used ? 'text-green-600' : 'text-gray-400'}`}>
                  <UserCheck size={16} /> {id.is_used ? 'Claimed' : 'Ready'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
