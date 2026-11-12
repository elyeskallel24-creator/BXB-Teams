import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Users, Building2, Globe, TrendingUp, DollarSign, ArrowRight, Activity, AlertTriangle } from 'lucide-react';
import { SkeletonBox } from '../components/Skeleton';

type Kpi = { label: string; value: number | string; tone: 'neutral' | 'info' | 'success' | 'brand'; icon: any; mono?: boolean };

const FUNNEL = ['New Lead','Researching','Ready to Contact','Contact Attempted','Contacted','Response Received','Qualified','Meeting Proposed','Meeting Scheduled','Discovery Completed','Technical Review','Proposal Preparation','Proposal Sent','Negotiation','Won'];
const OPEN_DEAL = ['Opportunity Created','Technical Assessment','Pricing Review','Proposal Draft','Internal Approval','Proposal Approved','Proposal Sent','Negotiation'];

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(n));
}

export default function GlobalCommandCenter() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [funnel, setFunnel] = useState<{ stage: string; count: number }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; members: number; leads: number; won: number; revenue: number; currency: string }[]>([]);
  const [attention, setAttention] = useState<{ label: string; count: number; go: () => void }[]>([]);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { if (profile) fetchAll(); }, [profile]);

  async function fetchAll() {
    setLoading(true);
    const [profilesRes, teamsRes, leadsRes, dealsRes, meetingsRes, handoversRes, tasksRes, countriesRes] = await Promise.all([
      supabase.from('profiles').select('id, team_id, role'),
      supabase.from('teams').select('id, name, country_id'),
      supabase.from('leads').select('id, team_id, stage, created_at'),
      supabase.from('deals').select('id, team_id, stage, estimated_value, currency'),
      supabase.from('meetings').select('id, status'),
      supabase.from('technical_handovers').select('id, status'),
      supabase.from('tasks').select('id, status, due_date'),
      supabase.from('countries').select('id'),
    ]);

    const profiles = (profilesRes.data || []) as any[];
    const teamsList = (teamsRes.data || []) as any[];
    const leads = (leadsRes.data || []) as any[];
    const deals = (dealsRes.data || []) as any[];
    const meetings = (meetingsRes.data || []) as any[];
    const handovers = (handoversRes.data || []) as any[];
    const tasks = (tasksRes.data || []) as any[];
    const countries = (countriesRes.data || []) as any[];

    const activeReps = profiles.filter(p => p.role === 'member').length;
    const wonDeals = deals.filter(d => d.stage === 'Won');
    const openDeals = deals.filter(d => OPEN_DEAL.includes(d.stage));
    const pendingHandovers = handovers.filter(h => ['Submitted','Awaiting Review','Under Technical Assessment'].includes(h.status)).length;
    const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled' && t.due_date && t.due_date < new Date().toISOString().split('T')[0]).length;

    const revByCur: Record<string, number> = {};
    wonDeals.forEach(d => {
      const c = d.currency || 'USD';
      revByCur[c] = (revByCur[c] || 0) + (d.estimated_value || 0);
    });
    const domCur = Object.entries(revByCur).sort((a, b) => b[1] - a[1])[0];

    setKpis([
      { label: 'Reps', value: activeReps, tone: 'neutral', icon: Users },
      { label: 'Teams', value: teamsList.length, tone: 'neutral', icon: Building2 },
      { label: 'Countries', value: countries.length, tone: 'info', icon: Globe },
      { label: 'Open deals', value: openDeals.length, tone: 'info', icon: Activity },
      { label: 'Deals won', value: wonDeals.length, tone: 'success', icon: TrendingUp },
      { label: 'Revenue', value: domCur ? compact(domCur[1]) + ' ' + domCur[0] : '—', tone: 'success', icon: DollarSign, mono: true },
    ]);

    setFunnel(FUNNEL.map(stage => ({ stage, count: leads.filter(l => l.stage === stage).length })));

    const teamStats = teamsList.map(t => {
      const mem = profiles.filter(p => p.team_id === t.id).length;
      const tLeads = leads.filter(l => l.team_id === t.id).length;
      const tWon = deals.filter(d => d.team_id === t.id && d.stage === 'Won');
      const tRev = tWon.reduce((s, d) => s + (d.estimated_value || 0), 0);
      const tCur = tWon[0]?.currency || 'USD';
      return { id: t.id, name: t.name, members: mem, leads: tLeads, won: tWon.length, revenue: tRev, currency: tCur };
    }).sort((a, b) => b.won - a.won);
    setTeams(teamStats);

    setAttention([
      { label: 'Overdue tasks', count: overdueTasks, go: () => navigate('/tasks') },
      { label: 'Pending handovers', count: pendingHandovers, go: () => navigate('/technical-handovers') },
      { label: 'Unassigned leads', count: leads.filter((l: any) => !l.assigned_to && !['Won','Lost','Disqualified'].includes(l.stage)).length, go: () => navigate('/leads') },
      { label: 'Meetings awaiting', count: meetings.filter(m => ['Proposed','Awaiting Confirmation'].includes(m.status)).length, go: () => navigate('/meetings') },
    ]);

    setLoading(false);
  }

  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto animate-enter">
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-state-dangerSoft text-state-danger rounded-2xl flex items-center justify-center mb-3 mx-auto">
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">Admin access required</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            The Global Command Center shows data across all teams. Ask an administrator to grant you access.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <SkeletonBox className="h-8 w-56 mb-2" />
        <SkeletonBox className="h-4 w-40 mb-5" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
          {[0,1,2,3,4,5].map(i => <SkeletonBox key={i} className="h-24 rounded-2xl" />)}
        </div>
        <SkeletonBox className="h-72 rounded-2xl mb-5" />
        <SkeletonBox className="h-64 rounded-2xl" />
      </div>
    );
  }

  const maxFunnel = Math.max(1, ...funnel.map(f => f.count));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-enter">
      <div className="mb-5 md:mb-6">
        <p className="text-[12px] text-text-mutedLight dark:text-text-mutedDark font-medium mb-0.5">Global overview</p>
        <h1 className="page-title">Command Center</h1>
        <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
          Every team, every market, one screen.
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-5">
        {kpis.map(k => {
          const tone = {
            neutral: 'text-text-secondaryLight dark:text-text-secondaryDark bg-black/5 dark:bg-white/5',
            info: 'text-state-info bg-state-infoSoft',
            success: 'text-state-success bg-state-successSoft',
            brand: 'text-brand-primary bg-brand-primary/10',
          }[k.tone];
          return (
            <div key={k.label} className="card !p-2.5">
              <div className={'w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ' + tone}>
                <k.icon size={14} />
              </div>
              <p className="eyebrow mb-0.5 truncate text-[10px]">{k.label}</p>
              <p className={'text-[16px] md:text-[18px] font-bold tracking-tight leading-none truncate ' + (k.mono ? 'font-mono tabular-nums' : '')}>{k.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-5">
        <h2 className="text-[15px] font-bold tracking-tight mb-2.5">Attention required</h2>
        <div className="grid grid-cols-2 gap-2">
          {attention.map(a => (
            <button key={a.label} onClick={a.go} className={'card !p-3 text-left flex items-center justify-between gap-2 active:scale-[0.98] transition-transform ' + (a.count > 0 ? 'border-brand-primary/20' : '')}>
              <div className="min-w-0">
                <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark truncate">{a.label}</p>
                <p className={'text-[18px] font-bold font-mono tabular-nums leading-none mt-0.5 ' + (a.count > 0 ? 'text-brand-primary' : 'text-text-mutedLight dark:text-text-mutedDark')}>{a.count}</p>
              </div>
              <ArrowRight size={14} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h2 className="text-[15px] font-bold tracking-tight mb-2.5">Global funnel</h2>
        <div className="card !p-3 space-y-2">
          {funnel.filter(f => f.count > 0).map(f => {
            const pct = Math.max(2, Math.round((f.count / maxFunnel) * 100));
            return (
              <div key={f.stage}>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-medium truncate">{f.stage}</span>
                  <span className="font-mono tabular-nums text-text-mutedLight dark:text-text-mutedDark shrink-0 ml-2">{f.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-brand-primary" style={{ width: pct + '%' }} />
                </div>
              </div>
            );
          })}
          {funnel.every(f => f.count === 0) && (
            <p className="text-[12px] text-text-mutedLight dark:text-text-mutedDark text-center py-4">No leads yet across the network.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-bold tracking-tight mb-2.5">Team comparison</h2>
        {teams.length === 0 ? (
          <div className="card !p-6 text-center text-[13px] text-text-mutedLight dark:text-text-mutedDark">
            No teams yet. Create one from the Teams page.
          </div>
        ) : (
          <div className="space-y-1.5">
            {teams.map((t, idx) => (
              <button key={t.id} onClick={() => navigate('/teams')} className="card !p-3 w-full text-left flex items-center gap-3 hover:border-brand-primary/30 transition-all">
                <span className="w-6 text-center font-mono tabular-nums text-[13px] font-bold text-text-mutedLight dark:text-text-mutedDark shrink-0">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold tracking-tight truncate">{t.name}</p>
                  <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark font-mono tabular-nums">
                    {t.members} rep{t.members === 1 ? '' : 's'} · {t.leads} leads · {t.won} won
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-mono tabular-nums font-bold text-brand-primary">{t.revenue > 0 ? compact(t.revenue) + ' ' + t.currency : '—'}</p>
                  <p className="text-[10px] text-text-mutedLight dark:text-text-mutedDark">revenue</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

