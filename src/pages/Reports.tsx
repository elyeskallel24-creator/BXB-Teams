import { useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Download, TrendingUp, Users, DollarSign, Calendar, Target, BarChart3 } from 'lucide-react';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type LeadRow = {
  id: string;
  stage: string;
  created_at: string;
  businesses: { industry: string | null; country: string | null; city: string | null } | null;
};

type DealRow = {
  id: string;
  stage: string;
  estimated_value: number | null;
  currency: string | null;
  created_at: string;
};

type MeetingRow = {
  id: string;
  meeting_date: string;
  status: string;
  created_at: string;
};

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'quarter', label: 'This quarter' },
  { key: 'year', label: 'This year' },
] as const;
type RangeKey = typeof RANGES[number]['key'];

const FUNNEL_STAGES = [
  'New Lead', 'Researching', 'Ready to Contact', 'Contact Attempted',
  'Contacted', 'Response Received', 'Qualified', 'Meeting Proposed',
  'Meeting Scheduled', 'Discovery Completed', 'Technical Review',
  'Proposal Preparation', 'Proposal Sent', 'Negotiation', 'Won',
];

const QUALIFIED_AND_BEYOND = [
  'Qualified', 'Meeting Proposed', 'Meeting Scheduled', 'Discovery Completed',
  'Technical Review', 'Proposal Preparation', 'Proposal Sent', 'Negotiation', 'Won',
];

const DEAL_STAGES = [
  'Opportunity Created', 'Technical Assessment', 'Pricing Review', 'Proposal Draft',
  'Internal Approval', 'Proposal Approved', 'Proposal Sent', 'Negotiation', 'Won', 'Lost',
];

function rangeStart(key: RangeKey): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (key === 'today') return d;
  if (key === 'week') {
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }
  if (key === 'month') { d.setDate(1); return d; }
  if (key === 'quarter') { d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1); return d; }
  if (key === 'year') { d.setMonth(0, 1); return d; }
  return d;
}

function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(n));
}

function KpiCard({ icon: Icon, label, value, tone, mono }: {
  icon: any; label: string; value: number | string;
  tone: 'neutral' | 'info' | 'success' | 'brand'; mono?: boolean;
}) {
  const toneClass = {
    neutral: 'text-text-secondaryLight dark:text-text-secondaryDark bg-black/5 dark:bg-white/5',
    info: 'text-state-info bg-state-infoSoft',
    success: 'text-state-success bg-state-successSoft',
    brand: 'text-brand-primary bg-brand-primary/10',
  }[tone];
  return (
    <div className="card !p-3">
      <div className={'w-8 h-8 rounded-lg flex items-center justify-center mb-2 ' + toneClass}>
        <Icon size={15} />
      </div>
      <p className="eyebrow mb-0.5 truncate">{label}</p>
      <p className={'text-[16px] md:text-[18px] font-bold tracking-tight leading-none truncate ' + (mono ? 'font-mono tabular-nums' : '')}>{value}</p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-3">
        <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">{subtitle}</p>}
      </div>
      <div className="card !p-4">{children}</div>
    </div>
  );
}

function Bar({ label, count, max, tone }: { label: string; count: number; max: number; tone: string }) {
  const pct = Math.max(2, Math.round((count / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1">
        <span className="font-medium truncate">{label}</span>
        <span className="font-mono tabular-nums text-text-mutedLight dark:text-text-mutedDark shrink-0 ml-2">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
        <div className={'h-full rounded-full ' + tone} style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
        <Icon size={28} />
      </div>
      <h3 className="text-[16px] font-bold mb-1">{title}</h3>
      <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">{body}</p>
    </div>
  );
}

export default function Reports() {
  const { profile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('month');
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [leadsRes, dealsRes, meetingsRes] = await Promise.all([
      supabase.from('leads').select('id, stage, created_at, businesses(industry, country, city)'),
      supabase.from('deals').select('id, stage, estimated_value, currency, created_at'),
      supabase.from('meetings').select('id, meeting_date, status, created_at'),
    ]);
    if (leadsRes.data) setLeads(leadsRes.data as any);
    if (dealsRes.data) setDeals(dealsRes.data as any);
    if (meetingsRes.data) setMeetings(meetingsRes.data as any);
    setLoading(false);
  }

  const start = rangeStart(range);
  const startIso = start.toISOString();
  const startDateStr = startIso.split('T')[0];

  const filteredLeads = leads.filter(l => l.created_at >= startIso);
  const filteredDeals = deals.filter(d => d.created_at >= startIso);
  const filteredMeetings = meetings.filter(m => m.meeting_date >= startDateStr && m.status === 'Completed');

  const totalLeads = filteredLeads.length;
  const qualifiedLeads = filteredLeads.filter(l => QUALIFIED_AND_BEYOND.includes(l.stage)).length;
  const meetingsHeld = filteredMeetings.length;
  const wonDeals = filteredDeals.filter(d => d.stage === 'Won');
  const wonCount = wonDeals.length;
  const conversion = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  const revByCur: Record<string, number> = {};
  wonDeals.forEach(d => {
    const c = d.currency || 'USD';
    revByCur[c] = (revByCur[c] || 0) + (d.estimated_value || 0);
  });
  const sortedCur = Object.entries(revByCur).sort((a, b) => b[1] - a[1]);
  const dominantCurrency = sortedCur[0]?.[0] || 'USD';
  const dominantValue = sortedCur[0]?.[1] || 0;
  const otherCurrencies = Math.max(0, sortedCur.length - 1);

  const funnelData = FUNNEL_STAGES.map(stage => ({
    stage,
    count: filteredLeads.filter(l => l.stage === stage).length,
  }));
  const maxFunnel = Math.max(1, ...funnelData.map(f => f.count));

  const industryCounts: Record<string, number> = {};
  filteredLeads.forEach(l => {
    const ind = l.businesses?.industry || 'Unknown';
    industryCounts[ind] = (industryCounts[ind] || 0) + 1;
  });
  const industryData = Object.entries(industryCounts)
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxIndustry = Math.max(1, ...industryData.map(i => i.count));

  const dealStageData = DEAL_STAGES.map(stage => ({
    stage,
    count: filteredDeals.filter(d => d.stage === stage).length,
  }));
  const maxDeal = Math.max(1, ...dealStageData.map(d => d.count));

  async function exportCSV() {
    try {
      const rows: (string | number)[][] = [
        ['BXB Sales Report'],
        ['Range', range],
        ['Generated', new Date().toISOString()],
        [],
        ['Metric', 'Value'],
        ['Total Leads', totalLeads],
        ['Qualified Leads', qualifiedLeads],
        ['Meetings Held', meetingsHeld],
        ['Won Deals', wonCount],
        ['Revenue (' + dominantCurrency + ')', dominantValue],
        ['Conversion Rate', conversion + '%'],
        [],
        ['Pipeline Funnel', 'Count'],
        ...funnelData.map(f => [f.stage, f.count]),
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bxb-report-' + range + '-' + new Date().toISOString().split('T')[0] + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report exported');
      if (profile) {
        await supabase.from('audit_logs').insert({
          actor_id: profile.id,
          action: 'report_export',
          entity_type: 'report',
          new_value: { range, totalLeads, wonCount },
        });
      }
    } catch {
      toast.error('Failed to export report');
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-24 rounded-xl" />
        </div>
        <div className="flex gap-1.5 mb-5">
          {[0, 1, 2, 3, 4].map(i => <SkeletonBox key={i} className="h-9 w-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {[0, 1, 2, 3, 4, 5].map(i => <SkeletonBox key={i} className="h-24 rounded-2xl" />)}
        </div>
        <SkeletonBox className="h-56 rounded-2xl mb-4" />
        <SkeletonBox className="h-56 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Reports</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {totalLeads} leads · {wonCount} won
          </p>
        </div>
        <button onClick={exportCSV} className="btn-secondary shrink-0 !h-[38px] !text-[12px]">
          <Download size={14} /> Export
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        {RANGES.map(r => (
          <button key={r.key} onClick={() => setRange(r.key)} className={range === r.key ? 'chip-active' : 'chip'}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard icon={Users} label="Total leads" value={totalLeads} tone="neutral" />
          <KpiCard icon={Target} label="Qualified" value={qualifiedLeads} tone="info" />
          <KpiCard icon={Calendar} label="Meetings held" value={meetingsHeld} tone="info" />
          <KpiCard icon={TrendingUp} label="Won deals" value={wonCount} tone="success" />
          <KpiCard icon={DollarSign} label={'Revenue (' + dominantCurrency + ')'} value={compact(dominantValue)} tone="success" mono />
          <KpiCard icon={BarChart3} label="Conversion" value={conversion + '%'} tone="brand" mono />
        </div>
        {otherCurrencies > 0 && (
          <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mt-2">
            Revenue is shown in {dominantCurrency}. {otherCurrencies} other currenc{otherCurrencies === 1 ? 'y is' : 'ies are'} not combined here.
          </p>
        )}
      </div>

      {totalLeads > 0 ? (
        <Section title="Pipeline funnel" subtitle="Leads by stage in this period">
          <div className="space-y-2.5">
            {funnelData.filter(f => f.count > 0).map(f => (
              <Bar key={f.stage} label={f.stage} count={f.count} max={maxFunnel} tone="bg-brand-primary" />
            ))}
          </div>
        </Section>
      ) : (
        <EmptyState icon={BarChart3} title="No leads in this period" body="Switch the range or create a lead to see pipeline metrics." />
      )}

      {industryData.length > 0 && (
        <Section title="Leads by industry" subtitle="Top industries in this period">
          <div className="space-y-2.5">
            {industryData.map(i => (
              <Bar key={i.industry} label={i.industry} count={i.count} max={maxIndustry} tone="bg-brand-primary/60" />
            ))}
          </div>
        </Section>
      )}

      {filteredDeals.length > 0 && (
        <Section title="Deals by stage" subtitle="Deal distribution in this period">
          <div className="space-y-2.5">
            {dealStageData.filter(d => d.count > 0).map(d => (
              <Bar
                key={d.stage}
                label={d.stage}
                count={d.count}
                max={maxDeal}
                tone={d.stage === 'Won' ? 'bg-state-success' : d.stage === 'Lost' ? 'bg-state-danger' : 'bg-brand-primary'}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
