import { useState, useEffect, useRef } from 'react';
import { localToday } from '../lib/date';
import { LEAD_STAGES, INACTIVE_STAGES, QUALIFIED_STAGES, stageBadgeClass } from '../lib/stages';
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

  useEffect(() => { fetchLeads(); }, []);

  const visibleLEAD_STAGES = filter === 'active'
    ? LEAD_STAGES.filter(s => !INACTIVE_STAGES.includes(s))
    : LEAD_STAGES;

  const grouped: Record<string, Lead[]> = {};
  visibleLEAD_STAGES.forEach(s => { grouped[s] = []; });
  filtered.forEach(l => {
    if (grouped[l.stage]) grouped[l.stage].push(l);
  });

  // Auto-select first non-empty stage on initial load
  useEffect(() => {
    if (loading) return;
    const firstNonEmpty = visibleLEAD_STAGES.find(s => (grouped[s]?.length || 0) > 0);
    if (firstNonEmpty) setActiveStage(firstNonEmpty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Reset active stage when it disappears from visible LEAD_STAGES (filter change)
  useEffect(() => {
    if (!visibleLEAD_STAGES.includes(activeStage)) {
      setActiveStage(visibleLEAD_STAGES[0] || 'New Lead');
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
            {leads.filter(l => !INACTIVE_STAGES.includes(l.stage)).length} active · {leads.length} total
          </p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input
          type="text"
          placeholder="Search leads..."
          className="input-field !pl-10"
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
                ? 'Switch to "All" to see more LEAD_STAGES.'
                : 'Create your first lead from the Leads page.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop kanban */}
          <div className="hidden md:flex gap-3 overflow-x-auto pb-4">
            {visibleLEAD_STAGES.map(stage => (
              <StageColumn key={stage} stage={stage} leads={grouped[stage] || []} onOpen={(l) => setSelectedLead(l)} />
            ))}
          </div>

          {/* Mobile: stage picker + snap board */}
          <div className="md:hidden">
            <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-3 scrollbar-hide">
              {visibleLEAD_STAGES.map(stage => (
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
              {visibleLEAD_STAGES.map(stage => (
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
                {LEAD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
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



