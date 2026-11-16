import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { localToday, localDatePlusDays } from '../lib/date';
import { INACTIVE_STAGES, QUALIFIED_STAGES, OPEN_DEAL_STAGES } from '../lib/stages';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import {
  Users, Target, Calendar, CheckCircle2, DollarSign, TrendingUp,
  Plus, Phone, Clock, AlertTriangle, ArrowRight
} from 'lucide-react';
import { SkeletonBox } from '../components/Skeleton';

type Lead = { id: string; stage: string; next_follow_up: string | null; priority: string | null; businesses: { name: string; industry: string | null; city: string | null } | null };
type Task = { id: string; title: string; status: string; priority: string; due_date: string | null };
type Meeting = { id: string; title: string; meeting_date: string; start_time: string; status: string };
type Deal = { id: string; stage: string; estimated_value: number | null; currency: string | null };





function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(n));
}

function Kpi({ icon: Icon, label, value, tone, mono }: { icon: any; label: string; value: number | string; tone: 'neutral' | 'success' | 'info' | 'brand'; mono?: boolean }) {
  const toneClass = {
    neutral: 'text-text-secondaryLight dark:text-text-secondaryDark bg-black/5 dark:bg-white/5',
    success: 'text-state-success bg-state-successSoft',
    info: 'text-state-info bg-state-infoSoft',
    brand: 'text-brand-primary bg-brand-primary/10',
  }[tone];
  return (
    <div className="card !p-3">
      <div className={'w-8 h-8 rounded-lg flex items-center justify-center mb-2 ' + toneClass}>
        <Icon size={15} />
      </div>
      <p className="eyebrow mb-0.5 truncate">{label}</p>
      <p className={'text-[18px] md:text-[20px] font-bold tracking-tight leading-none truncate ' + (mono ? 'font-mono tabular-nums' : '')}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => { if (profile) fetchAll(); }, [profile]);

  async function fetchAll() {
    setLoading(true);
    const todayStr = localToday();
    const [l, t, m, d] = await Promise.all([
      supabase.from('leads').select('id, stage, next_follow_up, priority, businesses(name, industry, city)').eq('assigned_to', profile!.id),
      supabase.from('tasks').select('id, title, status, priority, due_date').eq('assigned_to', profile!.id).not('status', 'in', '("Completed","Cancelled")'),
      supabase.from('meetings').select('id, title, meeting_date, start_time, status').eq('assigned_to', profile!.id).gte('meeting_date', todayStr).order('meeting_date', { ascending: true }).order('start_time', { ascending: true }).limit(20),
      supabase.from('deals').select('id, stage, estimated_value, currency').eq('assigned_to', profile!.id),
    ]);
    if (l.data) setLeads(l.data as any);
    if (t.data) setTasks(t.data as any);
    if (m.data) setMeetings(m.data as any);
    if (d.data) setDeals(d.data as any);
    setLoading(false);
  }

  const today = localToday();
  
  const weekAheadStr = localDatePlusDays(7);

  const activeLeads = leads.filter(l => !INACTIVE_STAGES.includes(l.stage)).length;
  const qualifiedLeads = leads.filter(l => QUALIFIED_STAGES.includes(l.stage)).length;
  const weekMeetings = meetings.filter(m => m.meeting_date <= weekAheadStr && ['Confirmed', 'Awaiting Confirmation', 'Proposed'].includes(m.status)).length;
  const overdueTasks = tasks.filter(t => t.due_date && t.due_date < today).length;
  const wonDeals = deals.filter(d => d.stage === 'Won').length;

  const openDealsByCurrency: Record<string, number> = {};
  deals.filter(d => OPEN_DEAL_STAGES.includes(d.stage) && d.estimated_value).forEach(d => {
    const c = d.currency || 'USD';
    openDealsByCurrency[c] = (openDealsByCurrency[c] || 0) + (d.estimated_value || 0);
  });
  const domCur = Object.entries(openDealsByCurrency).sort((a, b) => b[1] - a[1])[0];
  const pipelineValue = domCur ? compact(domCur[1]) + ' ' + domCur[0] : '—';

  type Priority = { id: string; kind: 'task' | 'meeting' | 'followup'; icon: any; tone: string; title: string; subtitle: string; go: () => void };
  const priorities: Priority[] = [];

  tasks.filter(t => t.due_date && t.due_date < today).slice(0, 3).forEach(t => {
    priorities.push({
      id: 't-' + t.id, kind: 'task', icon: AlertTriangle, tone: 'text-state-danger bg-state-dangerSoft',
      title: t.title,
      subtitle: 'Overdue · ' + new Date(t.due_date!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      go: () => navigate('/tasks'),
    });
  });
  tasks.filter(t => t.due_date === today).slice(0, 2).forEach(t => {
    priorities.push({
      id: 't-' + t.id, kind: 'task', icon: Clock, tone: 'text-brand-primary bg-brand-primary/10',
      title: t.title, subtitle: 'Due today',
      go: () => navigate('/tasks'),
    });
  });
  meetings.filter(m => m.meeting_date === today).slice(0, 2).forEach(m => {
    priorities.push({
      id: 'm-' + m.id, kind: 'meeting', icon: Calendar, tone: 'text-state-info bg-state-infoSoft',
      title: m.title,
      subtitle: 'Meeting · ' + m.start_time.slice(0, 5),
      go: () => navigate('/meetings'),
    });
  });
  leads.filter(l => l.next_follow_up && l.next_follow_up <= today && !INACTIVE_STAGES.includes(l.stage)).slice(0, 3).forEach(l => {
    priorities.push({
      id: 'l-' + l.id, kind: 'followup', icon: Phone, tone: 'text-state-warning bg-state-warningSoft',
      title: l.businesses?.name || 'Lead',
      subtitle: 'Follow-up due' + (l.businesses?.city ? ' · ' + l.businesses.city : ''),
      go: () => navigate('/leads'),
    });
  });

  const quickActions = [
    { label: 'Add Lead', icon: Plus, go: () => navigate('/leads', { state: { openCreate: true } }) },
    { label: 'Log Call', icon: Phone, go: () => navigate('/leads') },
    { label: 'Schedule', icon: Calendar, go: () => navigate('/meetings', { state: { openCreate: true } }) },
    { label: 'New Task', icon: CheckCircle2, go: () => navigate('/tasks', { state: { openCreate: true } }) },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <SkeletonBox className="h-8 w-48 mb-2" />
        <SkeletonBox className="h-4 w-32 mb-5" />
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[0,1,2,3].map(i => <SkeletonBox key={i} className="h-16 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {[0,1,2,3,4,5].map(i => <SkeletonBox key={i} className="h-24 rounded-2xl" />)}
        </div>
        <SkeletonBox className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-enter">
      <div className="mb-5 md:mb-6">
        <p className="text-[12px] text-text-mutedLight dark:text-text-mutedDark font-medium mb-0.5">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="page-title">
          {greeting()}{profile?.username ? ', ' + profile.username : ''}
        </h1>
        <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
          {overdueTasks > 0
            ? `${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'} need your attention`
            : priorities.length > 0
              ? `${priorities.length} priorit${priorities.length === 1 ? 'y' : 'ies'} for today`
              : 'You are all caught up'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        {quickActions.map(a => (
          <button
            key={a.label}
            onClick={a.go}
            className="card !p-2.5 flex flex-col items-center gap-1 active:scale-[0.97] transition-transform"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <a.icon size={15} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-semibold truncate w-full text-center">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <Kpi icon={Users} label="Active leads" value={activeLeads} tone="neutral" />
        <Kpi icon={Target} label="Qualified" value={qualifiedLeads} tone="info" />
        <Kpi icon={Calendar} label="Meetings (7d)" value={weekMeetings} tone="info" />
        <Kpi icon={AlertTriangle} label="Overdue tasks" value={overdueTasks} tone={overdueTasks > 0 ? 'brand' : 'neutral'} />
        <Kpi icon={TrendingUp} label="Deals won" value={wonDeals} tone="success" />
        <Kpi icon={DollarSign} label="Pipeline" value={pipelineValue} tone="success" mono />
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[15px] font-bold tracking-tight">Today's priorities</h2>
          {priorities.length > 0 && (
            <button onClick={() => navigate('/tasks')} className="text-[11px] font-semibold text-brand-primary hover:text-brand-primaryHover flex items-center gap-0.5">
              View all <ArrowRight size={11} />
            </button>
          )}
        </div>
        {priorities.length === 0 ? (
          <div className="card !p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-state-successSoft text-state-success flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-[13px] font-semibold mb-0.5">You are all caught up</p>
            <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark">
              No overdue tasks, no follow-ups due, no meetings today.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {priorities.slice(0, 6).map(p => (
              <button
                key={p.id}
                onClick={p.go}
                className="card !p-2.5 w-full text-left flex items-center gap-3 active:scale-[0.995] transition-all hover:border-brand-primary/30"
              >
                <div className={'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ' + p.tone}>
                  <p.icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold tracking-tight truncate">{p.title}</p>
                  <p className="text-[11px] text-text-secondaryLight dark:text-text-secondaryDark truncate">{p.subtitle}</p>
                </div>
                <ArrowRight size={14} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {deals.length > 0 && (
        <div>
          <h2 className="text-[15px] font-bold tracking-tight mb-2.5">Deal pipeline</h2>
          <div className="card !p-3">
            <div className="flex items-center justify-between mb-2 text-[11px]">
              <span className="text-text-mutedLight dark:text-text-mutedDark">Open stages</span>
              <span className="font-mono tabular-nums font-semibold">{deals.filter(d => OPEN_DEAL_STAGES.includes(d.stage)).length} open</span>
            </div>
            <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden flex">
              {['Opportunity Created','Technical Assessment','Pricing Review','Proposal Draft','Internal Approval','Proposal Approved','Proposal Sent','Negotiation'].map((stage, i) => {
                const count = deals.filter(d => d.stage === stage).length;
                const total = deals.filter(d => OPEN_DEAL_STAGES.includes(d.stage)).length;
                if (count === 0) return null;
                const pct = (count / total) * 100;
                const opacity = 0.25 + (i / 7) * 0.75;
                return <div key={stage} className="h-full bg-brand-primary" style={{ width: pct + '%', opacity }} title={stage + ': ' + count} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

