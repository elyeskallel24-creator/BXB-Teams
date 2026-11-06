import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, UserCheck, Shield } from 'lucide-react';

type AllowedId = { id: string; user_id_code: string; role: string; is_used: boolean; created_at: string; };

export default function Admin() {
  const { profile } = useAuth();
  const [allowedIds, setAllowedIds] = useState<AllowedId[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState('member');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (profile?.role === 'admin') fetchAllowedIds();
  }, [profile]);

  async function fetchAllowedIds() {
    const { data } = await supabase.from('allowed_user_ids').select('*').order('created_at', { ascending: false });
    if (data) setAllowedIds(data);
    setLoading(false);
  }

  async function generateId(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    const nextNumber = allowedIds.length > 0 ? Math.max(...allowedIds.map(id => parseInt(id.user_id_code.split('-')[1]) || 0)) + 1 : 1;
    const newCode = 'SALES-' + nextNumber.toString().padStart(4, '0');
    const { error } = await supabase.from('allowed_user_ids').insert({ team_id: profile?.team_id, user_id_code: newCode, role: newRole });
    if (!error) fetchAllowedIds();
    setIsGenerating(false);
  }

  if (loading || profile?.role !== 'admin') return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-smooth">
      <div>
        <h1 className="page-title">Admin Tools</h1>
        <p className="text-text-secondaryLight dark:text-text-secondaryDark mb-6">Manage team access and generate new User IDs.</p>
      </div>
      
      <div className="card space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Shield size={20} className="text-brand-primary" /> Generate New ID
        </h3>
        
        <form onSubmit={generateId} className="flex flex-col sm:flex-row gap-3">
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input-field flex-1">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" disabled={isGenerating} className="btn-primary">
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Generate
          </button>
        </form>

        <div className="space-y-3 mt-6">
          {allowedIds.map(id => (
            <div key={id.id} className="flex justify-between items-center p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-surface-borderLight dark:border-surface-borderDark">
              <div>
                <p className="font-mono font-bold text-lg">{id.user_id_code}</p>
                <p className="text-xs text-text-secondaryLight dark:text-text-secondaryDark uppercase tracking-wider font-semibold mt-1">{id.role}</p>
              </div>
              <div className={`flex items-center gap-2 text-sm font-semibold ${id.is_used ? 'text-green-500' : 'text-text-secondaryLight dark:text-text-secondaryDark'}`}>
                <UserCheck size={18} /> {id.is_used ? 'Claimed' : 'Ready'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
