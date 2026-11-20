import { useState, useEffect } from 'react';
import { DEAL_STAGES, OPEN_DEAL_STAGES, stageBadgeClass } from '../lib/stages';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, DollarSign, ChevronRight, Calendar } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Deal = {
  id: string;
  title: string;
  stage: string;
  estimated_value: number | null;
  currency: string | null;
  expected_close_date: string | null;
  service_description: string | null;
  notes: string | null;
};





const CURRENCIES = ['USD', 'EUR', 'TND', 'GBP'];

type Filter = 'all' | 'open' | 'won' | 'lost';

export default function Deals() {
  const { profile } = useAuth();
  const toast = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const [title, setTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchDeals(); }, []);

  async function fetchDeals() {
    setLoading(true);
    const { data } = await supabase
      .from('deals')
      .select('id, title, stage, estimated_value, currency, expected_close_date, service_description, notes, lead_id, leads(businesses(name))')
      .order('created_at', { ascending: false });
    if (data) setDeals(data as any);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title) return;
    setSaving(true);
    const { error } = await supabase.from('deals').insert({
      title,
      service_description: serviceDescription || null,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
      currency,
      expected_close_date: expectedCloseDate || null,
      notes: notes || null,
      stage: 'Opportunity Created',
      created_by: profile.id,
      assigned_to: profile.id,
      team_id: profile.team_id,
    });
    if (!error) {
      toast.success('Deal created');
      setTitle(''); setServiceDescription(''); setEstimatedValue('');
      setCurrency('USD'); setExpectedCloseDate(''); setNotes(''); setLeadId('');
      setShowSheet(false);
      fetchDeals();
    } else {
      toast.error('Could not create deal');
    }
    setSaving(false);
  }

  async function updateStage(id: string, stage: string) {
    setUpdatingStage(id);
    const { error } = await supabase.from('deals').update({ stage }).eq('id', id);
    if (!error) {
      toast.success('Stage updated');
      await fetchDeals();
      if (selected) setSelected({ ...selected, stage });
    } else {
      toast.error('Failed to update stage');
    }
    setUpdatingStage(null);
  }

  function formatValue(value: number | null, currency: string | null) {
    if (!value) return null;
    return (currency || 'USD') + ' ' + value.toLocaleString();
  }

  const counts = {
    all: deals.length,
    open: deals.filter(d => OPEN_DEAL_STAGES.includes(d.stage)).length,
    won: deals.filter(d => d.stage === 'Won').length,
    lost: deals.filter(d => d.stage === 'Lost').length,
  };

  const filtered = deals.filter(d => {
    if (filter === 'open') return OPEN_DEAL_STAGES.includes(d.stage);
    if (filter === 'won') return d.stage === 'Won';
    if (filter === 'lost') return d.stage === 'Lost';
    return true;
  });

  const totalOpenValue = deals
    .filter(d => OPEN_DEAL_STAGES.includes(d.stage) && d.estimated_value)
    .reduce((sum, d) => sum + (d.estimated_value || 0), 0);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-24" />
          <SkeletonBox className="h-11 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[0, 1, 2].map(i => <SkeletonBox key={i} className="h-16 rounded-2xl" />)}
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
          <h1 className="page-title">Deals</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {counts.open} open · {counts.won} won
          </p>
        </div>
        <button onClick={() => setShowSheet(true)} className="btn-primary shrink-0">
          <Plus size={18} strokeWidth={2.5} /> New Deal
        </button>
      </div>

      {counts.open > 0 && totalOpenValue > 0 && (
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={13} className="text-brand-primary shrink-0" />
            <span className="eyebrow">Pipeline value</span>
          </div>
          <p className="text-[24px] font-bold font-mono tabular-nums tracking-tighter leading-none">
            {totalOpenValue.toLocaleString()}
          </p>
          <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mt-1">
            Across {deals.filter(d => OPEN_DEAL_STAGES.includes(d.stage) && d.estimated_value).length} deals with a value set
          </p>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        {([
          { key: 'all', label: 'All' },
          { key: 'open', label: 'Open' },
          { key: 'won', label: 'Won' },
          { key: 'lost', label: 'Lost' },
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
            <DollarSign size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">
            {filter === 'all' ? 'No deals yet' : 'Nothing here'}
          </h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {filter === 'all'
              ? 'Create a deal when a lead becomes an opportunity.'
              : 'Switch to "All" to see the full list.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const valueLabel = formatValue(d.estimated_value, d.currency);
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className="card p-3.5 md:p-4 w-full text-left hover:border-brand-primary/30 active:scale-[0.995] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <DollarSign size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold tracking-tight leading-snug flex-1 min-w-0 truncate">
                        {d.title}
                      </h3>
                      <ChevronRight size={16} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
                    </div>
                    {valueLabel && (
                      <p className="text-[13px] font-mono tabular-nums text-brand-primary font-semibold mb-1.5">
                        {valueLabel}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={stageBadgeClass(d.stage)}>{d.stage}</span>
                      {d.expected_close_date && (
                        <span className="badge-neutral">
                          Close {new Date(d.expected_close_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
        title={selected?.title || 'Deal'}
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="eyebrow mb-1.5">Update stage</p>
              <select
                value={selected.stage}
                onChange={e => updateStage(selected.id, e.target.value)}
                disabled={updatingStage === selected.id}
                className="input-field w-full"
              >
                {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {updatingStage === selected.id && (
                <p className="text-[11px] text-brand-primary font-medium mt-1.5 flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" /> Updating…
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className={stageBadgeClass(selected.stage)}>{selected.stage}</span>
              {selected.expected_close_date && (
                <span className="badge-neutral">
                  Close {new Date(selected.expected_close_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            {selected.estimated_value && (
              <div>
                <p className="eyebrow mb-1.5">Estimated value</p>
                <div className="card !p-3">
                  <p className="text-[22px] font-bold font-mono tabular-nums tracking-tight text-brand-primary leading-none">
                    {(selected.currency || 'USD')} {selected.estimated_value.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {(selected.service_description || selected.notes) && (
              <div className="space-y-3">
                {selected.service_description && (
                  <div>
                    <p className="eyebrow mb-1.5">Service</p>
                    <div className="card !p-3 text-[13px] leading-relaxed">
                      {selected.service_description}
                    </div>
                  </div>
                )}
                {selected.notes && (
                  <div>
                    <p className="eyebrow mb-1.5">Notes</p>
                    <div className="card !p-3 text-[13px] leading-relaxed">
                      {selected.notes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selected.expected_close_date && (
              <div className="flex items-center gap-1.5 text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">
                <Calendar size={12} />
                <span>Expected close {new Date(selected.expected_close_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title="New Deal"
        footer={
          <button type="submit" form="new-deal-form" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Deal'}
          </button>
        }
      >
        <form id="new-deal-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Deal title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. ABC Restaurant — POS automation"
              required
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Service description</label>
            <textarea
              value={serviceDescription}
              onChange={e => setServiceDescription(e.target.value)}
              className="input-field"
              placeholder="What we are proposing"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1.5">Value</label>
              <input
                type="number"
                inputMode="numeric"
                value={estimatedValue}
                onChange={e => setEstimatedValue(e.target.value)}
                className="input-field font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-field">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Expected close date</label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={e => setExpectedCloseDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field"
              placeholder="Optional"
              rows={2}
            />
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}

