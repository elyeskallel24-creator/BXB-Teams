import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, KeyRound, ShieldAlert, Check, Copy } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type AllowedId = {
  id: string;
  user_id_code: string;
  team_id: string;
  role: string;
  is_used: boolean;
  created_at: string;
};

export default function Admin() {
  const { profile } = useAuth();
  const toast = useToast();
  const [allowed, setAllowed] = useState<AllowedId[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const [newCode, setNewCode] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [newTeam, setNewTeam] = useState('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { if (isAdmin) fetchAll(); else setLoading(false); }, [profile]);

  async function fetchAll() {
    setLoading(true);
    const [aRes, tRes] = await Promise.all([
      supabase.from('allowed_user_ids').select('*').order('is_used', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('teams').select('id, name').order('name'),
    ]);
    if (aRes.data) setAllowed(aRes.data as any);
    if (tRes.data) {
      setTeams(tRes.data as any);
      if (tRes.data.length > 0) setNewTeam((tRes.data[0] as any).id);
    }
    setLoading(false);
  }

  function suggestCode() {
    const prefix = newRole === 'admin' ? 'BXB' : 'SALES';
    const num = Math.floor(1000 + Math.random() * 9000);
    setNewCode(prefix + '-' + num);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode.trim() || !newTeam) return;
    setSaving(true);
    const { error } = await supabase.from('allowed_user_ids').insert({
      user_id_code: newCode.trim().toUpperCase(),
      team_id: newTeam,
      role: newRole,
      is_used: false,
    });
    if (!error) {
      toast.success('User ID generated');
      setGeneratedCode(newCode.trim().toUpperCase());
      setNewCode('');
      fetchAll();
    } else {
      toast.error(error.message.includes('duplicate') ? 'That code already exists' : 'Could not generate ID');
    }
    setSaving(false);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-state-dangerSoft text-state-danger rounded-2xl flex items-center justify-center mb-3 mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">Admin access required</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            Only administrators can generate User IDs and manage members.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-28 rounded-xl" />
        </div>
        <div className="space-y-2">
          {[0,1,2,3].map(i => <SkeletonBox key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const unused = allowed.filter(a => !a.is_used);
  const used = allowed.filter(a => a.is_used);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Admin</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {unused.length} open code{unused.length === 1 ? '' : 's'} · {used.length} claimed
          </p>
        </div>
        <button onClick={() => { suggestCode(); setShowForm(true); setGeneratedCode(null); }} className="btn-primary shrink-0">
          <Plus size={18} strokeWidth={2.5} /> New ID
        </button>
      </div>

      {generatedCode && (
        <div className="card !p-4 mb-5 border-brand-primary/30">
          <p className="eyebrow mb-1.5">Generated User ID</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[18px] font-mono tabular-nums font-bold text-brand-primary tracking-tight">{generatedCode}</code>
            <button onClick={() => copyCode(generatedCode)} className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center active:scale-95 transition-transform">
              <Copy size={16} />
            </button>
          </div>
          <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mt-2">
            Share this code with the new member. They will enter it during sign-up to claim their account.
          </p>
        </div>
      )}

      {unused.length > 0 && (
        <div className="mb-5">
          <p className="eyebrow mb-2 px-1">Available to claim</p>
          <div className="space-y-1.5">
            {unused.map(a => {
              const teamName = teams.find(t => t.id === a.team_id)?.name;
              return (
                <div key={a.id} className="card !p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <KeyRound size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-mono tabular-nums font-semibold truncate">{a.user_id_code}</p>
                    <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark truncate">
                      {teamName || 'Unassigned team'} · {a.role}
                    </p>
                  </div>
                  <button onClick={() => copyCode(a.user_id_code)} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-mutedLight dark:text-text-mutedDark active:bg-black/5 dark:active:bg-white/5">
                    <Copy size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {used.length > 0 && (
        <div>
          <p className="eyebrow mb-2 px-1">Already claimed</p>
          <div className="space-y-1.5">
            {used.map(a => {
              const teamName = teams.find(t => t.id === a.team_id)?.name;
              return (
                <div key={a.id} className="card !p-2.5 flex items-center gap-2.5 opacity-70">
                  <div className="w-8 h-8 rounded-lg bg-state-successSoft text-state-success flex items-center justify-center shrink-0">
                    <Check size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-mono tabular-nums font-semibold truncate">{a.user_id_code}</p>
                    <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark truncate">
                      {teamName || '—'} · {a.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Generate User ID"
        footer={
          <button type="submit" form="new-code" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Generating…</> : 'Generate ID'}
          </button>
        }
      >
        <form id="new-code" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">User ID *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                className="input-field font-mono flex-1"
                placeholder="SALES-0002"
                required
              />
              <button type="button" onClick={suggestCode} className="btn-secondary !h-[44px] !px-3 !text-[12px]">Auto</button>
            </div>
            <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mt-1">
              Prefix by role: BXB-#### for admins, SALES-#### for members.
            </p>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Team *</label>
            <select value={newTeam} onChange={e => setNewTeam(e.target.value)} className="input-field" required>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Role *</label>
            <select value={newRole} onChange={e => { setNewRole(e.target.value); suggestCode(); }} className="input-field">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}

