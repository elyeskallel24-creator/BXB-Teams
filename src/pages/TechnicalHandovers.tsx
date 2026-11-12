import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Wrench, ChevronRight, Clock } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Handover = {
  id: string;
  title: string;
  project_type: string | null;
  status: string;
  client_problem: string | null;
  current_solution: string | null;
  expected_result: string | null;
  desired_solution: string | null;
  existing_software: string | null;
  existing_website: string | null;
  integrations: string | null;
  technical_restrictions: string | null;
  budget_info: string | null;
  timeline: string | null;
  urgency: string | null;
  competitors: string | null;
  created_at: string;
};

const PROJECT_TYPES = ['Website', 'Web Application', 'AI Solution', 'Automation', 'API Integration', 'Custom Software', 'Other'];
const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_OPTIONS = [
  'Draft', 'Submitted', 'Awaiting Review', 'Under Technical Assessment',
  'More Information Required', 'Feasible', 'Feasible With Changes', 'Not Feasible',
  'Proposal Preparation', 'Approved', 'Closed',
];

const ACTIVE_STATUSES = ['Draft', 'Submitted', 'Awaiting Review', 'Under Technical Assessment', 'More Information Required'];
const REVIEW_STATUSES = ['Under Technical Assessment', 'More Information Required'];
const DONE_STATUSES = ['Feasible', 'Feasible With Changes', 'Not Feasible', 'Proposal Preparation', 'Approved', 'Closed'];

function statusBadgeClass(s: string) {
  if (['Approved', 'Feasible', 'Feasible With Changes'].includes(s)) return 'badge-success';
  if (s === 'Not Feasible') return 'badge-danger';
  if (s === 'Closed') return 'badge-neutral';
  if (s === 'Proposal Preparation') return 'badge-brand';
  if (REVIEW_STATUSES.includes(s)) return 'badge-warning';
  return 'badge-info';
}

function urgencyBadgeClass(u: string | null) {
  if (!u) return 'badge-neutral';
  if (u === 'Critical') return 'badge-danger';
  if (u === 'High') return 'badge-warning';
  if (u === 'Low') return 'badge-neutral';
  return 'badge-info';
}

type Filter = 'all' | 'active' | 'review' | 'done';

export default function TechnicalHandovers() {
  const { profile } = useAuth();
  const toast = useToast();
  const routerLocation = useLocation();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Handover | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const [leadId, setLeadId] = useState('');
  const [leads, setLeads] = useState<{ id: string; name: string }[]>([]);

  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState('Website');
  const [urgency, setUrgency] = useState('Medium');
  const [clientProblem, setClientProblem] = useState('');
  const [currentSolution, setCurrentSolution] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [desiredSolution, setDesiredSolution] = useState('');
  const [existingSoftware, setExistingSoftware] = useState('');
  const [existingWebsite, setExistingWebsite] = useState('');
  const [integrations, setIntegrations] = useState('');
  const [technicalRestrictions, setTechnicalRestrictions] = useState('');
  const [budgetInfo, setBudgetInfo] = useState('');
  const [timeline, setTimeline] = useState('');
  const [competitors, setCompetitors] = useState('');

  useEffect(() => {
    fetchHandovers();
    async function fetchLeadsList() {
      const { data } = await supabase.from('leads').select('id, businesses(name)');
      if (data) setLeads(data.map((l: any) => ({ id: l.id, name: l.businesses?.name || 'Unnamed' })));
    }
    fetchLeadsList();
  }, []);

  useEffect(() => {
    const state = (routerLocation.state as any) || {};
    if (state.openCreate) {
      setShowSheet(true);
      if (state.leadId) setLeadId(state.leadId);
    }
  }, [routerLocation.state]);

  async function fetchHandovers() {
    setLoading(true);
    const { data } = await supabase
      .from('technical_handovers')
      .select('id, title, project_type, status, urgency, created_at, client_problem, current_solution, expected_result, desired_solution, existing_software, existing_website, integrations, technical_restrictions, budget_info, timeline, competitors')
      .order('created_at', { ascending: false });
    if (data) setHandovers(data as any);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title) return;
    setSaving(true);
    const { error } = await supabase.from('technical_handovers').insert({
      lead_id: leadId || null,
      title,
      project_type: projectType,
      urgency,
      client_problem: clientProblem || null,
      current_solution: currentSolution || null,
      expected_result: expectedResult || null,
      desired_solution: desiredSolution || null,
      existing_software: existingSoftware || null,
      existing_website: existingWebsite || null,
      integrations: integrations || null,
      technical_restrictions: technicalRestrictions || null,
      budget_info: budgetInfo || null,
      timeline: timeline || null,
      competitors: competitors || null,
      status: 'Draft',
      created_by: profile.id,
    });
    if (!error) {
      toast.success('Technical request created');
      setLeadId(''); setTitle(''); setProjectType('Website'); setUrgency('Medium');
      setClientProblem(''); setCurrentSolution(''); setExpectedResult(''); setDesiredSolution('');
      setExistingSoftware(''); setExistingWebsite(''); setIntegrations(''); setTechnicalRestrictions('');
      setBudgetInfo(''); setTimeline(''); setCompetitors('');
      setShowSheet(false);
      fetchHandovers();
    } else {
      toast.error('Could not create request');
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingStatus(true);
    const { error } = await supabase.from('technical_handovers').update({ status }).eq('id', id);
    if (!error) {
      toast.success('Status updated');
      await fetchHandovers();
      if (selected) setSelected({ ...selected, status });
    } else {
      toast.error('Failed to update status');
    }
    setUpdatingStatus(false);
  }

  const filtered = handovers.filter(h => {
    if (filter === 'active') return ACTIVE_STATUSES.includes(h.status);
    if (filter === 'review') return REVIEW_STATUSES.includes(h.status);
    if (filter === 'done') return DONE_STATUSES.includes(h.status);
    return true;
  });

  const counts = {
    all: handovers.length,
    active: handovers.filter(h => ACTIVE_STATUSES.includes(h.status)).length,
    review: handovers.filter(h => REVIEW_STATUSES.includes(h.status)).length,
    done: handovers.filter(h => DONE_STATUSES.includes(h.status)).length,
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-32 rounded-xl" />
        </div>
        <div className="flex gap-1.5 mb-5">
          {[0, 1, 2, 3].map(i => <SkeletonBox key={i} className="h-9 w-20 rounded-xl" />)}
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="card p-3.5">
              <SkeletonBox className="h-4 w-2/3 mb-2" />
              <SkeletonBox className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Handovers</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {counts.active} active · {counts.done} done
          </p>
        </div>
        <button onClick={() => setShowSheet(true)} className="btn-primary shrink-0">
          <Plus size={18} strokeWidth={2.5} /> New Request
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        {([
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'review', label: 'Under Review' },
          { key: 'done', label: 'Done' },
        ] as { key: Filter; label: string }[]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={filter === f.key ? 'chip-active' : 'chip'}>
            {f.label}
            {counts[f.key] > 0 && (
              <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{counts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Wrench size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">
            {filter === 'all' ? 'No technical requests' : 'Nothing here'}
          </h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {filter === 'all'
              ? 'Submit a request when a prospect needs a technical assessment.'
              : 'Switch to "All" to see the full list.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(h => (
            <button
              key={h.id}
              onClick={() => setSelected(h)}
              className="card p-3.5 md:p-4 w-full text-left hover:border-brand-primary/30 active:scale-[0.995] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                  <Wrench size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="text-[14px] font-semibold tracking-tight leading-snug flex-1 min-w-0 truncate">
                      {h.title}
                    </h3>
                    <ChevronRight size={16} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
                  </div>
                  <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark truncate mb-2">
                    {h.project_type || 'General'}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={statusBadgeClass(h.status)}>{h.status}</span>
                    {h.urgency && h.urgency !== 'Medium' && (
                      <span className={urgencyBadgeClass(h.urgency)}>{h.urgency}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Handover'}
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="eyebrow mb-1.5">Update status</p>
              <select
                value={selected.status}
                onChange={e => updateStatus(selected.id, e.target.value)}
                disabled={updatingStatus}
                className="input-field w-full"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {updatingStatus && (
                <p className="text-[11px] text-brand-primary font-medium mt-1.5 flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" /> Updating…
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className={statusBadgeClass(selected.status)}>{selected.status}</span>
              {selected.urgency && <span className={urgencyBadgeClass(selected.urgency)}>{selected.urgency}</span>}
              {selected.project_type && <span className="badge-neutral">{selected.project_type}</span>}
            </div>

            {(selected.client_problem || selected.current_solution || selected.expected_result || selected.desired_solution) && (
              <div>
                <p className="eyebrow mb-2">Client problem</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.client_problem && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Problem</p>
                      <p className="leading-relaxed">{selected.client_problem}</p>
                    </div>
                  )}
                  {selected.current_solution && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Current solution</p>
                      <p className="leading-relaxed">{selected.current_solution}</p>
                    </div>
                  )}
                  {selected.expected_result && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Expected result</p>
                      <p className="leading-relaxed">{selected.expected_result}</p>
                    </div>
                  )}
                  {selected.desired_solution && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Desired solution</p>
                      <p className="leading-relaxed">{selected.desired_solution}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selected.existing_software || selected.existing_website || selected.integrations || selected.technical_restrictions) && (
              <div>
                <p className="eyebrow mb-2">Technical environment</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.existing_software && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Existing software</p>
                      <p className="leading-relaxed">{selected.existing_software}</p>
                    </div>
                  )}
                  {selected.existing_website && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Existing website</p>
                      <p className="leading-relaxed break-all">{selected.existing_website}</p>
                    </div>
                  )}
                  {selected.integrations && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Integrations needed</p>
                      <p className="leading-relaxed">{selected.integrations}</p>
                    </div>
                  )}
                  {selected.technical_restrictions && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Technical restrictions</p>
                      <p className="leading-relaxed">{selected.technical_restrictions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selected.budget_info || selected.timeline || selected.competitors) && (
              <div>
                <p className="eyebrow mb-2">Commercial context</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.budget_info && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Budget</p>
                      <p className="leading-relaxed">{selected.budget_info}</p>
                    </div>
                  )}
                  {selected.timeline && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Timeline</p>
                      <p className="leading-relaxed">{selected.timeline}</p>
                    </div>
                  )}
                  {selected.competitors && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Competitors</p>
                      <p className="leading-relaxed">{selected.competitors}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark flex items-center gap-1 pt-1">
              <Clock size={11} /> {new Date(selected.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title="New Technical Request"
        footer={
          <button type="submit" form="new-handover-form" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="animate-spin" size={18} /> : 'Submit Request'}
          </button>
        }
      >
        <form id="new-handover-form" onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-3">
            <p className="eyebrow">Basic info</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Link to Lead</label>
              <select value={leadId} onChange={e => setLeadId(e.target.value)} className="input-field">
                <option value="">None</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Request title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g. Restaurant POS automation"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium mb-1.5">Project type</label>
                <select value={projectType} onChange={e => setProjectType(e.target.value)} className="input-field">
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5">Urgency</label>
                <select value={urgency} onChange={e => setUrgency(e.target.value)} className="input-field">
                  {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Client problem</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">What problem is the client trying to solve?</label>
              <textarea
                value={clientProblem}
                onChange={e => setClientProblem(e.target.value)}
                className="input-field"
                placeholder="Describe the client's situation"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">What do they currently use?</label>
              <textarea
                value={currentSolution}
                onChange={e => setCurrentSolution(e.target.value)}
                className="input-field"
                placeholder="Existing tools or process"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">What result do they expect?</label>
              <textarea
                value={expectedResult}
                onChange={e => setExpectedResult(e.target.value)}
                className="input-field"
                placeholder="The outcome they want"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Desired solution</label>
              <textarea
                value={desiredSolution}
                onChange={e => setDesiredSolution(e.target.value)}
                className="input-field"
                placeholder="What we should propose"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Technical environment</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Existing software</label>
              <input
                type="text"
                value={existingSoftware}
                onChange={e => setExistingSoftware(e.target.value)}
                className="input-field"
                placeholder="e.g. QuickBooks, Shopify"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Existing website</label>
              <input
                type="text"
                value={existingWebsite}
                onChange={e => setExistingWebsite(e.target.value)}
                className="input-field"
                placeholder="https://…"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Integrations needed</label>
              <input
                type="text"
                value={integrations}
                onChange={e => setIntegrations(e.target.value)}
                className="input-field"
                placeholder="e.g. Stripe, WhatsApp API"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Technical restrictions</label>
              <textarea
                value={technicalRestrictions}
                onChange={e => setTechnicalRestrictions(e.target.value)}
                className="input-field"
                placeholder="Anything we cannot promise"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Commercial context</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Budget info</label>
              <input
                type="text"
                value={budgetInfo}
                onChange={e => setBudgetInfo(e.target.value)}
                className="input-field"
                placeholder="Only if the client volunteered it"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Timeline</label>
              <input
                type="text"
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                className="input-field"
                placeholder="e.g. 2 months, ASAP"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Competitors considered</label>
              <input
                type="text"
                value={competitors}
                onChange={e => setCompetitors(e.target.value)}
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
