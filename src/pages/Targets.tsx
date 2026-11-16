import { useState, useEffect } from 'react';
import { localToday } from '../lib/date';
import { QUALIFIED_STAGES } from '../lib/stages';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Target as TargetIcon, Calendar } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Target = {
  id: string;
  title: string;
  description: string | null;
  target_type: string;
  scope: string;
  scope_id: string | null;
  target_value: number;
  period_start: string;
  period_end: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  prospects: 'New prospects',
  qualified: 'Qualified leads',
  meetings: 'Meetings held',
  handovers: 'Handovers',
  proposals: 'Proposals sent',
  won: 'Deals won',
};

function statusOf(t: Target) {
  const today = localToday();
  if (!t.is_active) return 'Archived';
  if (t.period_end < today) return 'Ended';
  if (t.period_start > today) return 'Upcoming';
  return 'Active';
}
function statusBadge(s: string) {
  if (s === 'Active') return 'badge-success';
  if (s === 'Upcoming') return 'badge-info';
  if (s === 'Ended') return 'badge-neutral';
  return 'badge-neutral';
}

type Filter = 'all' | 'active' | 'ended';

export default function Targets() {
  const { profile } = useAuth();
  const toast = useToast();
  const [targets, setTargets] = useState<Target[]>([]);
  const [actuals, setActuals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Target | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [profiles, setProfiles] = useState<{ id: string; username: string }[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState('prospects');
  const [scope, setScope] = useState('individual');
  const [scopeId, setScopeId] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { fetchAll(); }, [profile]);

  async function fetchAll() {
    setLoading(true);
    const [targetsRes, leadsRes, meetingsRes, dealsRes, profilesRes] = await Promise.all([
      supabase.from('sales_targets').select('*').order('is_active', { ascending: false }).order('period_end', { ascending: false }),
      supabase.from('leads').select('id, stage, assigned_to, created_at'),
      supabase.from('meetings').select('id, status, assigned_to, meeting_date'),
      supabase.from('deals').select('id, stage, assigned_to, created_at'),
      isAdmin ? supabase.from('profiles').select('id, username').order('username') : Promise.resolve({ data: [] }),
    ]);
    const tList = (targetsRes.data || []) as Target[];
    setTargets(tList);
    if (profilesRes.data) setProfiles(profilesRes.data as any);

    const leads = (leadsRes.data || []) as any[];
    const meetings = (meetingsRes.data || []) as any[];
    const deals = (dealsRes.data || []) as any[];
    

    const result: Record<string, number> = {};
    tList.forEach(t => {
      const inRange = (d: string) => d >= t.period_start && d <= t.period_end;
      const matchesScope = (row: any) => {
        if (t.scope === 'global') return true;
        if (t.scope === 'individual') return row.assigned_to === t.scope_id;
        return true;
      };
      let count = 0;
      if (t.target_type === 'prospects') {
        count = leads.filter(l => matchesScope(l) && inRange(l.created_at.split('T')[0])).length;
      } else if (t.target_type === 'qualified') {
        count = leads.filter(l => matchesScope(l) && inRange(l.created_at.split('T')[0]) && QUALIFIED_STAGES.includes(l.stage)).length;
      } else if (t.target_type === 'meetings') {
        count = meetings.filter(m => matchesScope(m) && inRange(m.meeting_date) && m.status === 'Completed').length;
      } else if (t.target_type === 'won') {
        count = deals.filter(d => matchesScope(d) && inRange(d.created_at.split('T')[0]) && d.stage === 'Won').length;
      }
      result[t.id] = count;
    });
    setActuals(result);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title || !targetValue || !periodStart || !periodEnd) return;
    setSaving(true);
    const { error } = await supabase.from('sales_targets').insert({
      title,
      description: description || null,
      target_type: targetType,
      scope,
      scope_id: scope === 'individual' ? (scopeId || profile.id) : null,
      target_value: parseInt(targetValue, 10),
      period_start: periodStart,
      period_end: periodEnd,
      created_by: profile.id,
      is_active: true,
    });
    if (!error) {
      toast.success('Target created');
      setTitle(''); setDescription(''); setTargetType('prospects'); setScope('individual');
      setScopeId(''); setTargetValue(''); setPeriodStart(''); setPeriodEnd('');
      setShowForm(false);
      fetchAll();
    } else {
      toast.error('Could not create target');
    }
    setSaving(false);
  }

  const filtered = targets.filter(t => {
    const s = statusOf(t);
    if (filter === 'active') return s === 'Active';
    if (filter === 'ended') return s === 'Ended' || s === 'Archived';
    return true;
  });

  const activeCount = targets.filter(t => statusOf(t) === 'Active').length;

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-24 rounded-xl" />
        </div>
        <div className="flex gap-1.5 mb-5">
          {[0,1,2].map(i => <SkeletonBox key={i} className="h-9 w-20 rounded-xl" />)}
        </div>
        <div className="space-y-2">
          {[0,1,2].map(i => <SkeletonBox key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Targets</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {activeCount} active · {targets.length} total
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            <Plus size={18} strokeWidth={2.5} /> New Target
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        {([
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'ended', label: 'Ended' },
        ] as { key: Filter; label: string }[]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={filter === f.key ? 'chip-active' : 'chip'}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <TargetIcon size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">No targets</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {isAdmin ? 'Create a target from the button above.' : 'Your admin has not set targets yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const s = statusOf(t);
            const actual = actuals[t.id] || 0;
            const pct = t.target_value > 0 ? Math.min(100, Math.round((actual / t.target_value) * 100)) : 0;
            const barTone = pct >= 100 ? 'bg-state-success' : pct >= 50 ? 'bg-brand-primary' : 'bg-brand-primary/60';
            return (
              <button key={t.id} onClick={() => setSelected(t)} className="card p-3 w-full text-left hover:border-brand-primary/30 active:scale-[0.995] transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-[14px] font-semibold tracking-tight flex-1 min-w-0 truncate">{t.title}</h3>
                  <span className={statusBadge(s)}>{s}</span>
                </div>
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className="text-text-mutedLight dark:text-text-mutedDark truncate">
                    {TYPE_LABELS[t.target_type] || t.target_type}
                  </span>
                  <span className="font-mono tabular-nums font-semibold shrink-0 ml-2">
                    {actual} / {t.target_value}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden mb-1.5">
                  <div className={'h-full rounded-full ' + barTone} style={{ width: pct + '%' }} />
                </div>
                <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark font-mono tabular-nums">
                  {new Date(t.period_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(t.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Target'}
      >
        {selected && (() => {
          const actual = actuals[selected.id] || 0;
          const pct = selected.target_value > 0 ? Math.min(100, Math.round((actual / selected.target_value) * 100)) : 0;
          const owner = profiles.find(p => p.id === selected.scope_id);
          return (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={statusBadge(statusOf(selected))}>{statusOf(selected)}</span>
                <span className="badge-neutral">{TYPE_LABELS[selected.target_type] || selected.target_type}</span>
                <span className="badge-neutral">{selected.scope === 'individual' ? (owner?.username || 'Individual') : selected.scope}</span>
              </div>

              {selected.description && (
                <div>
                  <p className="eyebrow mb-1.5">Description</p>
                  <div className="card !p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{selected.description}</div>
                </div>
              )}

              <div>
                <p className="eyebrow mb-1.5">Progress</p>
                <div className="card !p-3">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-[24px] font-bold font-mono tabular-nums tracking-tight leading-none">{actual}</p>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mt-0.5">of {selected.target_value}</p>
                    </div>
                    <span className="text-[20px] font-bold font-mono tabular-nums text-brand-primary">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <div className={'h-full ' + (pct >= 100 ? 'bg-state-success' : 'bg-brand-primary')} style={{ width: pct + '%' }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">
                <Calendar size={12} />
                <span>
                  {new Date(selected.period_start).toLocaleDateString()} – {new Date(selected.period_end).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })()}
      </BottomSheet>

      <BottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Target"
        footer={
          <button type="submit" form="new-target" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : 'Create Target'}
          </button>
        }
      >
        <form id="new-target" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="e.g. November qualifying sprint" required />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="Optional context" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1.5">Metric *</label>
              <select value={targetType} onChange={e => setTargetType(e.target.value)} className="input-field">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Target *</label>
              <input type="number" inputMode="numeric" value={targetValue} onChange={e => setTargetValue(e.target.value)} className="input-field font-mono" placeholder="20" required />
            </div>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Scope</label>
            <select value={scope} onChange={e => setScope(e.target.value)} className="input-field">
              <option value="individual">Individual</option>
              <option value="global">Global (all reps)</option>
            </select>
          </div>
          {scope === 'individual' && (
            <div>
              <label className="eyebrow block mb-1.5">Assign to</label>
              <select value={scopeId} onChange={e => setScopeId(e.target.value)} className="input-field">
                <option value="">Myself{profile ? ' (' + profile.username + ')' : ''}</option>
                {profiles.filter(p => p.id !== profile?.id).map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1.5">Start *</label>
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">End *</label>
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="input-field" required />
            </div>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
