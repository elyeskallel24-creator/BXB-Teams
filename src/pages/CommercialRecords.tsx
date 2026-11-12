import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, DollarSign, Search, ChevronRight, ShieldAlert } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type CommercialRecord = {
  id: string;
  deal_id: string | null;
  representative_id: string | null;
  compensation_basis: string | null;
  calculation: string | null;
  approval_status: string;
  agreement_reference: string | null;
  relevant_date: string | null;
  review_notes: string | null;
  created_by: string;
  created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  'Not Reviewed': 'badge-neutral',
  'Pending Documentation': 'badge-warning',
  'Pending Approval': 'badge-warning',
  'Approved for Recordkeeping': 'badge-success',
  'Disputed': 'badge-danger',
  'Closed': 'badge-neutral',
};

export default function CommercialRecords() {
  const { profile } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState<CommercialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CommercialRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; username: string }[]>([]);

  const [compensationBasis, setCompensationBasis] = useState('');
  const [calculation, setCalculation] = useState('');
  const [representative, setRepresentative] = useState('');
  const [status, setStatus] = useState('Not Reviewed');
  const [reference, setReference] = useState('');
  const [relevantDate, setRelevantDate] = useState('');
  const [notes, setNotes] = useState('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { if (isAdmin) fetchAll(); else setLoading(false); }, [profile]);

  async function fetchAll() {
    setLoading(true);
    const [rRes, pRes] = await Promise.all([
      supabase.from('commercial_records').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, username').order('username'),
    ]);
    if (rRes.data) setRecords(rRes.data as any);
    if (pRes.data) setProfiles(pRes.data as any);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('commercial_records').insert({
      representative_id: representative || null,
      compensation_basis: compensationBasis || null,
      calculation: calculation || null,
      approval_status: status,
      agreement_reference: reference || null,
      relevant_date: relevantDate || null,
      review_notes: notes || null,
      created_by: profile.id,
      team_id: profile.team_id,
    });
    if (!error) {
      toast.success('Record created');
      setCompensationBasis(''); setCalculation(''); setRepresentative('');
      setStatus('Not Reviewed'); setReference(''); setRelevantDate(''); setNotes('');
      setShowForm(false);
      fetchAll();
    } else {
      toast.error('Could not create record');
    }
    setSaving(false);
  }

  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-state-dangerSoft text-state-danger rounded-2xl flex items-center justify-center mb-3 mx-auto">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">Restricted access</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[280px] mx-auto">
            Commercial records are restricted to administrators. Contact your admin if you believe you should have access.
          </p>
        </div>
      </div>
    );
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.compensation_basis || '').toLowerCase().includes(q) ||
      (r.agreement_reference || '').toLowerCase().includes(q) ||
      (r.approval_status || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-40" />
          <SkeletonBox className="h-11 w-24 rounded-xl" />
        </div>
        <SkeletonBox className="h-11 w-full rounded-xl mb-5" />
        <div className="space-y-2">
          {[0,1,2].map(i => <SkeletonBox key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Commercial Records</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {records.length} record{records.length === 1 ? '' : 's'} · admin only
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
          <Plus size={18} strokeWidth={2.5} /> New Record
        </button>
      </div>

      <div className="card !p-3 mb-5">
        <p className="eyebrow mb-2">Confidentiality</p>
        <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark leading-relaxed">
          These records contain internal compensation data. They are never shown in client proposals, public catalogues, or to non-admin users.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input type="text" placeholder="Search by basis, reference, status..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <DollarSign size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">{search ? 'No matching records' : 'No records yet'}</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {search ? 'Try a different search.' : 'Create your first record from the button above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <button key={r.id} onClick={() => setSelected(r)} className="card p-3 w-full text-left hover:border-brand-primary/30 active:scale-[0.995] transition-all">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-[14px] font-semibold tracking-tight truncate flex-1 min-w-0">
                  {r.compensation_basis || 'Commercial record'}
                </h3>
                <ChevronRight size={16} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={STATUS_BADGE[r.approval_status] || 'badge-neutral'}>{r.approval_status}</span>
                {r.relevant_date && (
                  <span className="badge-neutral font-mono tabular-nums">
                    {new Date(r.relevant_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title="Commercial Record">
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-1.5">
              <span className={STATUS_BADGE[selected.approval_status] || 'badge-neutral'}>{selected.approval_status}</span>
              {selected.relevant_date && (
                <span className="badge-neutral font-mono tabular-nums">
                  {new Date(selected.relevant_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {selected.compensation_basis && (
              <div>
                <p className="eyebrow mb-1.5">Compensation basis</p>
                <div className="card !p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{selected.compensation_basis}</div>
              </div>
            )}
            {selected.calculation && (
              <div>
                <p className="eyebrow mb-1.5">Calculation</p>
                <div className="card !p-3 text-[13px] leading-relaxed whitespace-pre-wrap font-mono">{selected.calculation}</div>
              </div>
            )}
            {selected.agreement_reference && (
              <div>
                <p className="eyebrow mb-1.5">Agreement reference</p>
                <div className="card !p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{selected.agreement_reference}</div>
              </div>
            )}
            {selected.review_notes && (
              <div>
                <p className="eyebrow mb-1.5">Review notes</p>
                <div className="card !p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{selected.review_notes}</div>
              </div>
            )}

            <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark font-mono tabular-nums">
              Created {new Date(selected.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Commercial Record"
        footer={
          <button type="submit" form="new-record" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : 'Create Record'}
          </button>
        }
      >
        <form id="new-record" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Compensation basis</label>
            <textarea value={compensationBasis} onChange={e => setCompensationBasis(e.target.value)} className="input-field" placeholder="e.g. 8% of net deal value" rows={2} />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Calculation</label>
            <textarea value={calculation} onChange={e => setCalculation(e.target.value)} className="input-field font-mono" placeholder="e.g. 15000 * 0.08 = 1200" rows={2} />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Representative</label>
            <select value={representative} onChange={e => setRepresentative(e.target.value)} className="input-field">
              <option value="">—</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
              {Object.keys(STATUS_BADGE).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Agreement reference</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="input-field" placeholder="Contract or agreement ID" />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Relevant date</label>
            <input type="date" value={relevantDate} onChange={e => setRelevantDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Review notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field" rows={2} />
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}


