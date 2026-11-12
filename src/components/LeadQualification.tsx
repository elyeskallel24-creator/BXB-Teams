import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, ClipboardCheck, Save } from 'lucide-react';

type Qualification = {
  id: string;
  lead_id: string;
  business_fit: string | null;
  identified_problem: string | null;
  decision_maker: string | null;
  interest_level: string | null;
  commercial_readiness: string | null;
  score: number | null;
  missing_info: string | null;
  recommended_action: string | null;
  is_complete: boolean;
  review_status: string;
  review_notes: string | null;
};

export function LeadQualification({ leadId }: { leadId: string }) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [q, setQ] = useState<Qualification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [businessFit, setBusinessFit] = useState('');
  const [problem, setProblem] = useState('');
  const [decisionMaker, setDecisionMaker] = useState('');
  const [interest, setInterest] = useState('');
  const [commercial, setCommercial] = useState('');
  const [missingInfo, setMissingInfo] = useState('');
  const [recommended, setRecommended] = useState('');

  useEffect(() => { fetchQ(); }, [leadId]);

  async function fetchQ() {
    setLoading(true);
    const { data } = await supabase
      .from('lead_qualifications')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();
    if (data) {
      setQ(data as any);
      setBusinessFit(data.business_fit || '');
      setProblem(data.identified_problem || '');
      setDecisionMaker(data.decision_maker || '');
      setInterest(data.interest_level || '');
      setCommercial(data.commercial_readiness || '');
      setMissingInfo(data.missing_info || '');
      setRecommended(data.recommended_action || '');
    }
    setLoading(false);
  }

  function computeScore() {
    let s = 0;
    if (businessFit.trim()) s += 20;
    if (problem.trim()) s += 20;
    if (decisionMaker.trim()) s += 20;
    if (interest.trim()) s += 20;
    if (commercial.trim()) s += 20;
    return s;
  }

  async function handleSave(markComplete: boolean) {
    if (!profile) return;
    setSaving(true);
    setMsg('');
    const payload = {
      lead_id: leadId,
      business_fit: businessFit || null,
      identified_problem: problem || null,
      decision_maker: decisionMaker || null,
      interest_level: interest || null,
      commercial_readiness: commercial || null,
      score: computeScore(),
      missing_info: missingInfo || null,
      recommended_action: recommended || null,
      is_complete: markComplete,
      review_status: markComplete ? 'Submitted' : (q?.review_status || 'Draft'),
      created_by: profile.id,
      updated_at: new Date().toISOString()
    };
    let error;
    if (q) {
      ({ error } = await supabase.from('lead_qualifications').update(payload).eq('id', q.id));
    } else {
      ({ error } = await supabase.from('lead_qualifications').insert(payload));
    }
    if (!error) {
      setMsg(markComplete ? 'Submitted for review.' : 'Draft saved.');
      fetchQ();
    } else {
      setMsg(error.message);
    }
    setSaving(false);
  }

  async function handleReview(status: 'Approved' | 'Returned') {
    if (!q || !profile) return;
    setSaving(true);
    const { error } = await supabase.from('lead_qualifications').update({
      review_status: status,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString()
    }).eq('id', q.id);
    if (!error) fetchQ();
    setSaving(false);
  }

  if (loading) return <div className="py-3 flex justify-center"><Loader2 className="animate-spin text-brand-primary" size={18} /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-bold flex items-center gap-2"><ClipboardCheck size={16} /> Qualification</h4>
        {q && (
          <span className={'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ' + (q.review_status === 'Approved' ? 'bg-green-500/10 text-green-500' : q.review_status === 'Returned' ? 'bg-red-500/10 text-red-500' : q.review_status === 'Submitted' ? 'bg-orange-500/10 text-orange-500' : 'bg-black/5 dark:bg-white/5')}>
            {q.review_status}
          </span>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold mb-1">Business fit</label>
        <textarea value={businessFit} onChange={e => setBusinessFit(e.target.value)} className="input-field w-full" rows={2} placeholder="Genuine business? Fits BXB target market? Use case exists?" />
      </div>
      <div>
        <label className="block text-[11px] font-semibold mb-1">Identified problem</label>
        <textarea value={problem} onChange={e => setProblem(e.target.value)} className="input-field w-full" rows={2} placeholder="What is the business trying to improve?" />
      </div>
      <div>
        <label className="block text-[11px] font-semibold mb-1">Decision-maker</label>
        <textarea value={decisionMaker} onChange={e => setDecisionMaker(e.target.value)} className="input-field w-full" rows={2} placeholder="Right person identified? Meeting possible?" />
      </div>
      <div>
        <label className="block text-[11px] font-semibold mb-1">Interest</label>
        <textarea value={interest} onChange={e => setInterest(e.target.value)} className="input-field w-full" rows={2} placeholder="Actual interest expressed? Requested info?" />
      </div>
      <div>
        <label className="block text-[11px] font-semibold mb-1">Commercial readiness</label>
        <textarea value={commercial} onChange={e => setCommercial(e.target.value)} className="input-field w-full" rows={2} placeholder="Budget (if offered), timeline, active planning?" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold mb-1">Missing info</label>
          <input value={missingInfo} onChange={e => setMissingInfo(e.target.value)} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1">Recommended next step</label>
          <input value={recommended} onChange={e => setRecommended(e.target.value)} className="input-field w-full" />
        </div>
      </div>

      <div className="flex items-center justify-between text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">
        <span>Score: <strong>{computeScore()}</strong> / 100</span>
      </div>

      {msg && <p className="text-[12px] text-brand-primary">{msg}</p>}

      <div className="flex gap-2">
        <button onClick={() => handleSave(false)} disabled={saving} className="flex-1 h-[38px] bg-black/5 dark:bg-white/5 font-semibold rounded-xl text-[13px] flex items-center justify-center gap-1">
          {saving ? <Loader2 className="animate-spin" size={14} /> : <><Save size={13} /> Save Draft</>}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving} className="flex-1 h-[38px] bg-brand-primary text-black font-bold rounded-xl text-[13px]">
          Submit for Review
        </button>
      </div>

      {isAdmin && q?.review_status === 'Submitted' && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => handleReview('Approved')} className="flex-1 h-[36px] bg-green-500/10 text-green-500 font-semibold rounded-xl text-[12px]">Approve</button>
          <button onClick={() => handleReview('Returned')} className="flex-1 h-[36px] bg-red-500/10 text-red-500 font-semibold rounded-xl text-[12px]">Return</button>
        </div>
      )}
    </div>
  );
}
