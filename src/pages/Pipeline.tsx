import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Search, Layers, Building2 } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox, SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Lead = {
  id: string;
  business_id: string;
  stage: string;
  priority: string | null;
  next_follow_up: string | null;
  assigned_to: string | null;
  businesses: { name: string; industry: string | null; city: string | null } | null;
};

const STAGES = [
  'New Lead', 'Researching', 'Ready to Contact', 'Contact Attempted',
  'Contacted', 'Response Received', 'Qualified', 'Meeting Proposed',
  'Meeting Scheduled', 'Discovery Completed', 'Technical Review',
  'Proposal Preparation', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'Nurture', 'Disqualified', 'Duplicate',
];

const TERMINAL = ['Won', 'Lost', 'Disqualified', 'Duplicate', 'Nurture'];
const BRAND_STAGES = ['Qualified', 'Meeting Proposed', 'Meeting Scheduled', 'Discovery Completed', 'Technical Review', 'Proposal Preparation', 'Proposal Sent', 'Negotiation'];

function stageBadgeClass(stage: string) {
  if (stage === 'Won') return 'badge-success';
  if (['Lost', 'Disqualified', 'Duplicate'].includes(stage)) return 'badge-danger';
  if (stage === 'Nurture') return 'badge-neutral';
  if (BRAND_STAGES.includes(stage)) return 'badge-brand';
  return 'badge-info';
}

function StageColumn({ stage, leads, onOpen }: { stage: string; leads: Lead[]; onOpen: (lead: Lead) => void }) {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="shrink-0 w-full md:w-[300px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className={stageBadgeClass(stage)}>{stage}</span>
        <span className="text-[11px] font-semibold font-mono tabular-nums text-text-mutedLight dark:text-text-mutedDark">
          {leads.length}
        </span>
      </div>
      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-borderLight dark:border-surface-borderDark px-4 py-8 text-center">
          <p className="text-[12px] text-text-mutedLight dark:text-text-mutedDark">No leads</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map(lead => (
            <button
              key={lead.id}
              onClick={() => onOpen(lead)}
              className="card p-3 w-full text-left hover:border-brand-primary/30 active:scale-[0.995] transition-all"
            >
              <div className="flex items-start gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                  <Building2 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold tracking-tight truncate">{lead.businesses?.name || 'Unnamed'}</p>
                  <p className="text-[11px] text-text-secondaryLight dark:text-text-secondaryDark truncate">
                    {[lead.businesses?.industry, lead.businesses?.city].filter(Boolean).join(' · ') || 'No details'}
                  </p>
                </div>
              </div>
              {((lead.priority && lead.priority !== 'Medium') || lead.next_follow_up) && (
                <div className="flex flex-wrap gap-1.5">
                  {lead.priority && lead.priority !== 'Medium' && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-text-secondaryLight dark:text-text-secondaryDark">
                      {lead.priority}
                    </span>
                  )}
                  {lead.next_follow_up && (
                    <span className={'text-[10px] font-semibold px-1.5 py-0.5 rounded-md ' + (lead.next_follow_up < today ? 'bg-state-dangerSoft text-state-danger' : 'bg-black/5 dark:bg-white/5 text-text-secondaryLight dark:text-text-secondaryDark')}>
                      {new Date(lead.next_follow_up).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Filter = 'active' | 'all' | 'mine' | 'overdue' | 'unassigned';

export default function Pipeline() {
  const { profile } = useAuth();
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('active');
  const [activeStage, setActiveStage] = useState<string>('New Lead');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const mobileBoardRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('id, business_id, stage, priority, next_follow_up, assigned_to, businesses(name, industry, city)')
      .order('created_at', { ascending: false });
    if (!error && data) setLeads(data as any);
    setLoading(false);
  }

  async function handleUpdateStage(newStage: string) {
    if (!selectedLead) return;
    setIsUpdating(true);
    const { error } = await supabase.from('leads').update({ stage: newStage }).eq('id', selectedLead.id);
    if (!error) {
      toast.success('Stage updated');
      setSelectedLead({ ...selectedLead, stage: newStage });
      fetchLeads();
    } else {
      toast.error('Could not update stage');
    }
    setIsUpdating(false);
  }

  const today = new Date().toISOString().split('T')[0];

  const filtered = leads.filter(l => {
    const matchesSearch =
      !searchQuery ||
      (l.businesses?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.businesses?.industry || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.businesses?.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    switch (filter) {
      case 'active': return !TERMINAL.includes(l.stage);
      case 'mine': return l.assigned_to === profile?.id;
      case 'overdue': return !!l.next_follow_up && l.next_follow_up < today && !TERMINAL.includes(l.stage);
      case 'unassigned': return !l.assigned_to;
      default: return true;
    }
  });

  const visibleStages = filter === 'active'
    ? STAGES.filter(s => !TERMINAL.includes(s))
    : STAGES;

  const grouped: Record<string, Lead[]> = {};
  visibleStages.forEach(s => { grouped[s] = []; });
  filtered.forEach(l => {
    if (grouped[l.stage]) grouped[l.stage].push(l);
  });

  // Auto-select first non-empty stage on initial load
  useEffect(() => {
    if (loading) return;
    const firstNonEmpty = visibleStages.find(s => (grouped[s]?.length || 0) > 0);
    if (firstNonEmpty) setActiveStage(firstNonEmpty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Reset active stage when it disappears from visible stages (filter change)
  useEffect(() => {
    if (!visibleStages.includes(activeStage)) {
      setActiveStage(visibleStages[0] || 'New Lead');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function jumpToStage(stage: string) {
    setActiveStage(stage);
    const container = mobileBoardRef.current;
    if (!container) return;
    const el = container.querySelector('[data-stage="' + stage + '"]') as HTMLElement | null;
    if (el) {
      container.scrollTo({ left: el.offsetLeft - 24, behavior: 'smooth' });
    }
  }

  function handleMobileScroll() {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const container = mobileBoardRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const columns = container.querySelectorAll('[data-stage]');
      let bestStage = activeStage;
      let bestDist = Infinity;
      columns.forEach(col => {
        const rect = col.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(center - containerCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestStage = (col as HTMLElement).dataset.stage || activeStage;
        }
      });
      if (bestStage !== activeStage) setActiveStage(bestStage);
    }, 100);
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-full mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-10 w-24 rounded-xl" />
        </div>
        <SkeletonBox className="h-11 w-full rounded-xl mb-3" />
        <div className="flex gap-1.5 mb-4">
          {[0, 1, 2, 3, 4].map(i => <SkeletonBox key={i} className="h-8 w-20 rounded-xl" />)}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[0, 1].map(i => (
            <div key={i} className="shrink-0 w-[85vw] max-w-[340px] sm:w-[300px] space-y-2">
              <SkeletonBox className="h-6 w-24" />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-full mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Pipeline</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {leads.filter(l => !TERMINAL.includes(l.stage)).length} active · {leads.length} total
          </p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input
          type="text"
          placeholder="Search leads..."
          className="input-field pl-10"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-4 scrollbar-hide">
        {([
          { key: 'active', label: 'Active' },
          { key: 'all', label: 'All' },
          { key: 'mine', label: 'Mine' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'unassigned', label: 'Unassigned' },
        ] as { key: Filter; label: string }[]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={filter === f.key ? 'chip-active' : 'chip'}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Layers size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">
            {searchQuery ? 'No matching leads' : filter !== 'all' ? 'Nothing in this view' : 'No leads yet'}
          </h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[280px] mx-auto">
            {searchQuery
              ? 'Try a different search term.'
              : filter !== 'all'
                ? 'Switch to "All" to see more stages.'
                : 'Create your first lead from the Leads page.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop kanban */}
          <div className="hidden md:flex gap-3 overflow-x-auto pb-4">
            {visibleStages.map(stage => (
              <StageColumn key={stage} stage={stage} leads={grouped[stage] || []} onOpen={(l) => setSelectedLead(l)} />
            ))}
          </div>

          {/* Mobile: stage picker + snap board */}
          <div className="md:hidden">
            <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-3 scrollbar-hide">
              {visibleStages.map(stage => (
                <button
                  key={stage}
                  onClick={() => jumpToStage(stage)}
                  className={activeStage === stage ? 'chip-active' : 'chip'}
                >
                  {stage}
                  <span className="ml-1 opacity-70 font-mono text-[11px] tabular-nums">
                    {grouped[stage]?.length || 0}
                  </span>
                </button>
              ))}
            </div>
            <div
              ref={mobileBoardRef}
              onScroll={handleMobileScroll}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6"
            >
              {visibleStages.map(stage => (
                <div key={stage} data-stage={stage} className="snap-center shrink-0 w-[85vw] max-w-[340px]">
                  <StageColumn stage={stage} leads={grouped[stage] || []} onOpen={(l) => setSelectedLead(l)} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <BottomSheet
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.businesses?.name || 'Lead'}
      >
        {selectedLead && (
          <div className="space-y-4">
            <div>
              <p className="eyebrow mb-1.5">Current stage</p>
              <div className="mb-2">
                <span className={stageBadgeClass(selectedLead.stage)}>{selectedLead.stage}</span>
              </div>
              <select
                value={selectedLead.stage}
                onChange={e => handleUpdateStage(e.target.value)}
                disabled={isUpdating}
                className="input-field w-full"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <p className="eyebrow mb-1.5">Business</p>
              <div className="card !p-3 space-y-1.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondaryLight dark:text-text-secondaryDark">Industry</span>
                  <span className="font-medium truncate ml-2">{selectedLead.businesses?.industry || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondaryLight dark:text-text-secondaryDark">City</span>
                  <span className="font-medium truncate ml-2">{selectedLead.businesses?.city || '—'}</span>
                </div>
              </div>
            </div>

            {isUpdating && (
              <div className="flex items-center gap-2 text-[12px] text-brand-primary font-medium">
                <Loader2 className="animate-spin" size={14} />
                Updating stage…
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}



