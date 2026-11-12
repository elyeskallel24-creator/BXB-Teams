import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Users, Search, ChevronRight, MapPin } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Team = {
  id: string;
  name: string;
  country_id: string | null;
  team_type: string | null;
  created_at: string;
  countries: { name: string; code: string; flag: string | null } | null;
};
type Member = { id: string; username: string; user_id_code: string; role: string; avatar_url: string | null; points: number };

export default function TeamManagement() {
  const { profile } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Team | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamCountry, setTeamCountry] = useState('');
  const [teamType, setTeamType] = useState('sales');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { fetchAll(); }, [profile]);

  async function fetchAll() {
    setLoading(true);
    const [tRes, pRes, cRes] = await Promise.all([
      supabase.from('teams').select('id, name, country_id, team_type, created_at, countries(name, code, flag)').order('name'),
      supabase.from('profiles').select('id, username, user_id_code, role, avatar_url, points, team_id').order('username'),
      supabase.from('countries').select('id, name').order('name'),
    ]);
    if (tRes.data) setTeams(tRes.data as any);
    if (cRes.data) setCountries(cRes.data as any);
    const grouped: Record<string, Member[]> = {};
    ((pRes.data || []) as any[]).forEach(p => {
      if (!grouped[p.team_id]) grouped[p.team_id] = [];
      grouped[p.team_id].push({ id: p.id, username: p.username, user_id_code: p.user_id_code, role: p.role, avatar_url: p.avatar_url, points: p.points || 0 });
    });
    setMembers(grouped);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('teams').insert({
      name: teamName.trim(),
      country_id: teamCountry || null,
      team_type: teamType,
    });
    if (!error) {
      toast.success('Team created');
      setTeamName(''); setTeamCountry(''); setTeamType('sales');
      setShowForm(false);
      fetchAll();
    } else {
      toast.error('Could not create team');
    }
    setSaving(false);
  }

  const filtered = teams.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.countries?.name || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-24 rounded-xl" />
        </div>
        <SkeletonBox className="h-11 w-full rounded-xl mb-5" />
        <div className="space-y-2">
          {[0,1,2].map(i => <SkeletonBox key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Teams</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {teams.length} team{teams.length === 1 ? '' : 's'} · {Object.values(members).flat().length} members
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            <Plus size={18} strokeWidth={2.5} /> New Team
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input type="text" placeholder="Search teams or countries..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Users size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">{search ? 'No matching teams' : 'No teams yet'}</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {search ? 'Try a different search.' : isAdmin ? 'Create your first team.' : 'Your admin has not created any teams.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const list = members[t.id] || [];
            const adminCount = list.filter(m => m.role === 'admin').length;
            const totalPoints = list.reduce((s, m) => s + m.points, 0);
            return (
              <button key={t.id} onClick={() => setSelected(t)} className="card p-3 w-full text-left hover:border-brand-primary/30 active:scale-[0.995] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold tracking-tight leading-snug flex-1 min-w-0 truncate">{t.name}</h3>
                      <ChevronRight size={16} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      {t.countries && (
                        <span className="badge-neutral flex items-center gap-1">
                          {t.countries.flag && <span>{t.countries.flag}</span>}
                          {t.countries.name}
                        </span>
                      )}
                      {t.team_type && <span className="badge-neutral">{t.team_type}</span>}
                    </div>
                    <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark font-mono tabular-nums">
                      {list.length} member{list.length === 1 ? '' : 's'}
                      {adminCount > 0 && ` · ${adminCount} admin${adminCount === 1 ? '' : 's'}`}
                      {totalPoints > 0 && ` · ${totalPoints} pts`}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name || 'Team'}>
        {selected && (() => {
          const list = members[selected.id] || [];
          return (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-1.5">
                {selected.countries && (
                  <span className="badge-neutral flex items-center gap-1">
                    <MapPin size={11} /> {selected.countries.name}
                  </span>
                )}
                {selected.team_type && <span className="badge-neutral">{selected.team_type}</span>}
                <span className="badge-neutral">{list.length} members</span>
              </div>

              {list.length === 0 ? (
                <p className="text-[13px] text-text-mutedLight dark:text-text-mutedDark text-center py-6">No members yet.</p>
              ) : (
                <div>
                  <p className="eyebrow mb-2">Members</p>
                  <div className="space-y-1.5">
                    {list.map(m => (
                      <div key={m.id} className="card !p-2.5 flex items-center gap-2.5">
                        <img
                          src={m.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + m.username}
                          alt=""
                          className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate">{m.username}</p>
                          <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark font-mono">{m.user_id_code}</p>
                        </div>
                        <span className={'shrink-0 ' + (m.role === 'admin' ? 'badge-brand' : 'badge-neutral')}>{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </BottomSheet>

      <BottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Team"
        footer={
          <button type="submit" form="new-team" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : 'Create Team'}
          </button>
        }
      >
        <form id="new-team" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Team name *</label>
            <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className="input-field" placeholder="e.g. Tunisia Sales" required />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Country</label>
            <select value={teamCountry} onChange={e => setTeamCountry(e.target.value)} className="input-field">
              <option value="">No country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Team type</label>
            <select value={teamType} onChange={e => setTeamType(e.target.value)} className="input-field">
              <option value="sales">Sales</option>
              <option value="dev">Development</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
