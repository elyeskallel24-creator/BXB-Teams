import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, FileText, ChevronRight, CheckCircle2, X, Clock, DollarSign } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Proposal = {
  id: string;
  title: string;
  version: number;
  approval_status: string;
  pricing: number | null;
  currency: string | null;
  expiration_date: string | null;
  service_description: string | null;
  proposed_solution: string | null;
  scope_of_work: string | null;
  deliverables: string | null;
  exclusions: string | null;
  estimated_timeline: string | null;
  payment_milestones: string | null;
  maintenance_arrangements: string | null;
  created_at: string;
  created_by: string;
  assigned_to: string | null;
};

const CURRENCIES = ['USD', 'EUR', 'TND', 'GBP'];

function statusBadgeClass(s: string) {
  if (s === 'Approved') return 'badge-success';
  if (s === 'Rejected') return 'badge-danger';
  if (s === 'Pending Approval') return 'badge-warning';
  if (s === 'Sent') return 'badge-info';
  if (s === 'Expired') return 'badge-neutral';
  return 'badge-neutral';
}

type Filter = 'all' | 'draft' | 'pending' | 'approved' | 'sent';

export default function Proposals() {
  const { profile } = useAuth();
  const toast = useToast();
  const isAdmin = profile?.role === 'admin';
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const [title, setTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [scope, setScope] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [timeline, setTimeline] = useState('');
  const [pricing, setPricing] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [milestones, setMilestones] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [expiration, setExpiration] = useState('');

  useEffect(() => { fetchProposals(); }, []);

  async function fetchProposals() {
    setLoading(true);
    const { data } = await supabase
      .from('proposals')
      .select('id, title, version, approval_status, pricing, currency, expiration_date, service_description, proposed_solution, scope_of_work, deliverables, exclusions, estimated_timeline, payment_milestones, maintenance_arrangements, created_at, created_by, assigned_to')
      .order('created_at', { ascending: false });
    if (data) setProposals(data as any);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title) return;
    setSaving(true);
    const { error } = await supabase.from('proposals').insert({
      title,
      service_description: serviceDescription || null,
      proposed_solution: proposedSolution || null,
      scope_of_work: scope || null,
      deliverables: deliverables || null,
      exclusions: exclusions || null,
      estimated_timeline: timeline || null,
      pricing: pricing ? parseFloat(pricing) : null,
      currency,
      payment_milestones: milestones || null,
      maintenance_arrangements: maintenance || null,
      expiration_date: expiration || null,
      approval_status: 'Draft',
      version: 1,
      created_by: profile.id,
      assigned_to: profile.id,
    });
    if (!error) {
      toast.success('Proposal created');
      setTitle(''); setServiceDescription(''); setProposedSolution(''); setScope('');
      setDeliverables(''); setExclusions(''); setTimeline(''); setPricing('');
      setCurrency('USD'); setMilestones(''); setMaintenance(''); setExpiration('');
      setShowSheet(false);
      fetchProposals();
    } else {
      toast.error('Could not create proposal');
    }
    setSaving(false);
  }

      async function requestApproval(p: Proposal) {
    if (!profile) return;
    setUpdatingAction('request:' + p.id);
    const { error: approvalError } = await supabase.from('proposal_approvals').insert({
      proposal_id: p.id,
      requested_by: profile.id,
      decision: 'Pending',
    });
    if (approvalError) {
      toast.error('Could not request approval');
      setUpdatingAction(null);
      return;
    }
    const { error } = await supabase.from('proposals').update({ approval_status: 'Pending Approval' }).eq('id', p.id);
    if (!error) {
      toast.success('Approval requested');
      await fetchProposals();
      if (selected) setSelected({ ...selected, approval_status: 'Pending Approval' });
    } else {
      toast.error('Failed to request approval');
    }
    setUpdatingAction(null);
  }

  async function decideApproval(p: Proposal, decision: 'Approved' | 'Rejected') {
    if (!profile) return;
    const key = (decision === 'Approved' ? 'approve:' : 'reject:') + p.id;
    setUpdatingAction(key);
    
    const { error } = await supabase.rpc('decide_proposal_approval', { p_proposal_id: p.id, p_decision: decision });
    
    if (!error) {
      toast.success(decision === 'Approved' ? 'Proposal approved' : 'Proposal rejected');
      await fetchProposals();
      if (selected) setSelected({ ...selected, approval_status: decision });
    } else {
      toast.error('Failed to update proposal');
    }
    setUpdatingAction(null);
  }

  function formatValue(value: number | null, cur: string | null) {
    if (!value) return null;
    return (cur || 'USD') + ' ' + value.toLocaleString();
  }

  const counts = {
    all: proposals.length,
    draft: proposals.filter(p => p.approval_status === 'Draft').length,
    pending: proposals.filter(p => p.approval_status === 'Pending Approval').length,
    approved: proposals.filter(p => p.approval_status === 'Approved').length,
    sent: proposals.filter(p => p.approval_status === 'Sent').length,
  };

  const filtered = proposals.filter(p => {
    if (filter === 'draft') return p.approval_status === 'Draft';
    if (filter === 'pending') return p.approval_status === 'Pending Approval';
    if (filter === 'approved') return p.approval_status === 'Approved';
    if (filter === 'sent') return p.approval_status === 'Sent';
    return true;
  });

  const approvedValue = proposals
    .filter(p => p.approval_status === 'Approved' || p.approval_status === 'Sent')
    .reduce((s, p) => s + (p.pricing || 0), 0);
  const approvedCount = proposals.filter(
    p => (p.approval_status === 'Approved' || p.approval_status === 'Sent') && p.pricing
  ).length;

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-32 rounded-xl" />
        </div>
        <div className="flex gap-1.5 mb-5">
          {[0, 1, 2, 3, 4].map(i => <SkeletonBox key={i} className="h-9 w-20 rounded-xl" />)}
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
          <h1 className="page-title">Proposals</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {counts.pending} pending · {counts.approved} approved
          </p>
        </div>
        <button onClick={() => setShowSheet(true)} className="btn-primary shrink-0">
          <Plus size={18} strokeWidth={2.5} /> New Proposal
        </button>
      </div>

      {approvedValue > 0 && (
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={13} className="text-brand-primary shrink-0" />
            <span className="eyebrow">Approved value</span>
          </div>
          <p className="text-[24px] font-bold font-mono tabular-nums tracking-tighter leading-none">
            {approvedValue.toLocaleString()}
          </p>
          <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mt-1">
            Across {approvedCount} approved or sent proposal{approvedCount === 1 ? '' : 's'} with pricing
          </p>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        {([
          { key: 'all', label: 'All' },
          { key: 'draft', label: 'Draft' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'sent', label: 'Sent' },
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
            <FileText size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">
            {filter === 'all' ? 'No proposals yet' : 'Nothing here'}
          </h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {filter === 'all'
              ? 'Create a proposal to send to a prospect.'
              : 'Switch to "All" to see the full list.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const valueLabel = formatValue(p.pricing, p.currency);
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="card p-3.5 md:p-4 w-full text-left hover:border-brand-primary/30 active:scale-[0.995] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold tracking-tight leading-snug flex-1 min-w-0 truncate">
                        {p.title}
                      </h3>
                      <ChevronRight size={16} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
                    </div>
                    <p className="text-[12px] text-text-mutedLight dark:text-text-mutedDark mb-1.5">
                      v{p.version}{valueLabel ? ' · ' + valueLabel : ''}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={statusBadgeClass(p.approval_status)}>{p.approval_status}</span>
                      {p.expiration_date && (
                        <span className="badge-neutral">
                          Exp {new Date(p.expiration_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Proposal'}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-1.5">
              <span className={statusBadgeClass(selected.approval_status)}>{selected.approval_status}</span>
              <span className="badge-neutral">v{selected.version}</span>
              {selected.expiration_date && (
                <span className="badge-neutral">
                  Exp {new Date(selected.expiration_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            {selected.approval_status === 'Draft' && (
              <button
                onClick={() => requestApproval(selected)}
                disabled={!!updatingAction}
                className="btn-primary w-full"
              >
                {updatingAction === 'request:' + selected.id
                  ? <><Loader2 className="animate-spin" size={16} /> Requesting…</>
                  : 'Request approval'}
              </button>
            )}

            {isAdmin && selected.approval_status === 'Pending Approval' && (
              <div className="flex gap-2">
                <button
                  onClick={() => decideApproval(selected, 'Approved')}
                  disabled={!!updatingAction}
                  className="flex-1 h-[44px] rounded-xl bg-state-successSoft text-state-success font-semibold text-[13px] flex items-center justify-center gap-1 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {updatingAction === 'approve:' + selected.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <><CheckCircle2 size={14} /> Approve</>}
                </button>
                <button
                  onClick={() => decideApproval(selected, 'Rejected')}
                  disabled={!!updatingAction}
                  className="flex-1 h-[44px] rounded-xl bg-state-dangerSoft text-state-danger font-semibold text-[13px] flex items-center justify-center gap-1 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {updatingAction === 'reject:' + selected.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <><X size={14} /> Reject</>}
                </button>
              </div>
            )}

            {selected.pricing && (
              <div>
                <p className="eyebrow mb-1.5">Pricing</p>
                <div className="card !p-3">
                  <p className="text-[22px] font-bold font-mono tabular-nums tracking-tight text-brand-primary leading-none">
                    {selected.currency || 'USD'} {selected.pricing.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {selected.service_description && (
              <div>
                <p className="eyebrow mb-1.5">Service</p>
                <div className="card !p-3 text-[13px] leading-relaxed">{selected.service_description}</div>
              </div>
            )}

            {selected.proposed_solution && (
              <div>
                <p className="eyebrow mb-1.5">Proposed solution</p>
                <div className="card !p-3 text-[13px] leading-relaxed">{selected.proposed_solution}</div>
              </div>
            )}

            {selected.scope_of_work && (
              <div>
                <p className="eyebrow mb-1.5">Scope of work</p>
                <div className="card !p-3 text-[13px] leading-relaxed">{selected.scope_of_work}</div>
              </div>
            )}

            {(selected.deliverables || selected.exclusions) && (
              <div className="space-y-3">
                {selected.deliverables && (
                  <div>
                    <p className="eyebrow mb-1.5">Deliverables</p>
                    <div className="card !p-3 text-[13px] leading-relaxed">{selected.deliverables}</div>
                  </div>
                )}
                {selected.exclusions && (
                  <div>
                    <p className="eyebrow mb-1.5">Exclusions</p>
                    <div className="card !p-3 text-[13px] leading-relaxed">{selected.exclusions}</div>
                  </div>
                )}
              </div>
            )}

            {(selected.estimated_timeline || selected.payment_milestones || selected.maintenance_arrangements) && (
              <div>
                <p className="eyebrow mb-2">Commercial terms</p>
                <div className="card !p-3 space-y-2.5 text-[13px]">
                  {selected.estimated_timeline && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Timeline</p>
                      <p className="leading-relaxed">{selected.estimated_timeline}</p>
                    </div>
                  )}
                  {selected.payment_milestones && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Payment milestones</p>
                      <p className="leading-relaxed">{selected.payment_milestones}</p>
                    </div>
                  )}
                  {selected.maintenance_arrangements && (
                    <div>
                      <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mb-0.5">Maintenance</p>
                      <p className="leading-relaxed">{selected.maintenance_arrangements}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selected.expiration_date && (
              <div className="flex items-center gap-1.5 text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">
                <Clock size={12} />
                <span>Expires {new Date(selected.expiration_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title="New Proposal"
        footer={
          <button type="submit" form="new-proposal-form" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Proposal'}
          </button>
        }
      >
        <form id="new-proposal-form" onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-3">
            <p className="eyebrow">Basics</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g. POS automation — ABC Restaurant"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Service description</label>
              <textarea
                value={serviceDescription}
                onChange={e => setServiceDescription(e.target.value)}
                className="input-field"
                placeholder="What we are proposing"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Solution</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Proposed solution</label>
              <textarea
                value={proposedSolution}
                onChange={e => setProposedSolution(e.target.value)}
                className="input-field"
                placeholder="How we will deliver it"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Scope of work</label>
              <textarea
                value={scope}
                onChange={e => setScope(e.target.value)}
                className="input-field"
                placeholder="What is included in the engagement"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Deliverables</label>
              <textarea
                value={deliverables}
                onChange={e => setDeliverables(e.target.value)}
                className="input-field"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Exclusions</label>
              <textarea
                value={exclusions}
                onChange={e => setExclusions(e.target.value)}
                className="input-field"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
            <p className="eyebrow">Commercial</p>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Estimated timeline</label>
              <input
                type="text"
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                className="input-field"
                placeholder="e.g. 6 weeks"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium mb-1.5">Pricing</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pricing}
                  onChange={e => setPricing(e.target.value)}
                  className="input-field font-mono"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-field">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Payment milestones</label>
              <textarea
                value={milestones}
                onChange={e => setMilestones(e.target.value)}
                className="input-field"
                placeholder="e.g. 50% upfront, 50% on delivery"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Maintenance arrangements</label>
              <textarea
                value={maintenance}
                onChange={e => setMaintenance(e.target.value)}
                className="input-field"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5">Expiration date</label>
              <input
                type="date"
                value={expiration}
                onChange={e => setExpiration(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
