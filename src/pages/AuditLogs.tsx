import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Activity, Search, ShieldAlert, ChevronRight } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';


type Log = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  reason: string | null;
  created_at: string;
};

const ACTION_BADGE: Record<string, string> = {
  report_export: 'badge-info',
  role_change: 'badge-warning',
  team_change: 'badge-warning',
  lead_created: 'badge-neutral',
  lead_stage_changed: 'badge-info',
  lead_reassigned: 'badge-info',
  deal_stage_changed: 'badge-info',
  proposal_draft: 'badge-neutral',
  proposal_pending_approval: 'badge-warning',
  proposal_approved: 'badge-success',
  proposal_rejected: 'badge-danger',
  proposal_sent: 'badge-brand',
  commercial_record_not_reviewed: 'badge-neutral',
  commercial_record_pending_approval: 'badge-warning',
  commercial_record_approved_for_recordkeeping: 'badge-success',
  commercial_record_disputed: 'badge-danger',
  commercial_record_closed: 'badge-neutral',
};

function actionBadge(action: string) {
  return ACTION_BADGE[action] || 'badge-neutral';
}

export default function AuditLogs() {
  const { profile } = useAuth();

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [selected, setSelected] = useState<Log | null>(null);
  const [actorNames, setActorNames] = useState<Record<string, string>>({});

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { if (isAdmin) fetchAll(); else setLoading(false); }, [profile]);

  async function fetchAll() {
    setLoading(true);
    const [lRes, pRes] = await Promise.all([
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('profiles').select('id, username'),
    ]);
    if (lRes.data) setLogs(lRes.data as any);
    if (pRes.data) {
      const map: Record<string, string> = {};
      (pRes.data as any[]).forEach(p => { map[p.id] = p.username; });
      setActorNames(map);
    }
    setLoading(false);
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
            Audit logs are restricted to administrators.
          </p>
        </div>
      </div>
    );
  }

  const actions = Array.from(new Set(logs.map(l => l.action))).sort();
  const filtered = logs.filter(l => {
    if (actionFilter !== 'All' && l.action !== actionFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const actorName = (l.actor_id && actorNames[l.actor_id]) || '';
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      actorName.toLowerCase().includes(q) ||
      (l.reason || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <SkeletonBox className="h-8 w-32 mb-2" />
        <SkeletonBox className="h-4 w-40 mb-5" />
        <SkeletonBox className="h-11 w-full rounded-xl mb-5" />
        <div className="space-y-2">
          {[0,1,2,3,4].map(i => <SkeletonBox key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="mb-5 md:mb-6">
        <h1 className="page-title">Audit Logs</h1>
        <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
          {logs.length} events · showing latest 200
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input type="text" placeholder="Search action, actor, reason..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        <button onClick={() => setActionFilter('All')} className={actionFilter === 'All' ? 'chip-active' : 'chip'}>
          All
          <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{logs.length}</span>
        </button>
        {actions.map(a => (
          <button key={a} onClick={() => setActionFilter(a)} className={actionFilter === a ? 'chip-active' : 'chip'}>
            {a.replace(/_/g, ' ')}
            <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{logs.filter(l => l.action === a).length}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Activity size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">{search || actionFilter !== 'All' ? 'No matching events' : 'No events yet'}</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {search || actionFilter !== 'All' ? 'Try a different filter.' : 'Audit events will appear here as users act.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(l => (
            <button key={l.id} onClick={() => setSelected(l)} className="card !p-2.5 w-full text-left flex items-start gap-2.5 hover:border-brand-primary/30 active:scale-[0.995] transition-all">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                <Activity size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-0.5">
                  <p className="text-[13px] font-semibold leading-snug flex-1 min-w-0 truncate">
                    {l.action.replace(/_/g, ' ')}
                  </p>
                  <span className={actionBadge(l.action) + ' shrink-0'}>{l.entity_type}</span>
                </div>
                <p className="text-[11px] text-text-secondaryLight dark:text-text-secondaryDark truncate">
                  {(l.actor_id && actorNames[l.actor_id]) || 'System'}
                  {' · '}
                  <span className="font-mono tabular-nums">{new Date(l.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </p>
              </div>
              <ChevronRight size={14} className="text-text-mutedLight dark:text-text-mutedDark shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}

      <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.action.replace(/_/g, ' ') || 'Event'}>
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-1.5">
              <span className={actionBadge(selected.action)}>{selected.action.replace(/_/g, ' ')}</span>
              <span className="badge-neutral">{selected.entity_type}</span>
            </div>

            <div>
              <p className="eyebrow mb-1.5">When</p>
              <div className="card !p-3 text-[13px] font-mono tabular-nums">{new Date(selected.created_at).toLocaleString()}</div>
            </div>

            <div>
              <p className="eyebrow mb-1.5">Actor</p>
              <div className="card !p-3 text-[13px]">{(selected.actor_id && actorNames[selected.actor_id]) || 'System'}</div>
            </div>

            {selected.reason && (
              <div>
                <p className="eyebrow mb-1.5">Reason</p>
                <div className="card !p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{selected.reason}</div>
              </div>
            )}

            {selected.old_value && (
              <div>
                <p className="eyebrow mb-1.5">Previous value</p>
                <div className="card !p-3 text-[11px] font-mono bg-black/5 dark:bg-white/5 overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-all">{JSON.stringify(selected.old_value, null, 2)}</pre>
                </div>
              </div>
            )}

            {selected.new_value && (
              <div>
                <p className="eyebrow mb-1.5">New value</p>
                <div className="card !p-3 text-[11px] font-mono bg-brand-primary/5 overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-all">{JSON.stringify(selected.new_value, null, 2)}</pre>
                </div>
              </div>
            )}

            {selected.entity_id && (
              <div>
                <p className="eyebrow mb-1.5">Entity ID</p>
                <div className="card !p-3 text-[11px] font-mono break-all">{selected.entity_id}</div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}


