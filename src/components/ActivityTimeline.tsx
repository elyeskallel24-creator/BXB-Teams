import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from './BottomSheet';
import { Loader2, Plus, Phone, MessageSquare, Mail, MapPin, FileText, Clock } from 'lucide-react';

type Activity = {
  id: string;
  activity_type: string;
  outcome: string | null;
  notes: string | null;
  next_action: string | null;
  next_follow_up: string | null;
  created_at: string;
  profiles: { username: string } | null;
};

const ACTIVITY_TYPES = [
  'Phone Call',
  'Cold Email',
  'Follow-up Email',
  'WhatsApp Business Message',
  'LinkedIn Message',
  'Other Business Message',
  'In-Person Visit',
  'Discovery Meeting',
  'Follow-up Meeting',
  'Proposal Discussion',
  'Internal Coordination',
  'General Note'
];

const OUTCOMES = [
  'No Answer',
  'Busy',
  'Call Back Requested',
  'Message Sent',
  'Interested',
  'Not Interested',
  'Wrong Contact',
  'Decision-Maker Identified',
  'Meeting Requested',
  'Meeting Confirmed',
  'Needs More Information',
  'Follow-up Required'
];

const ICONS: Record<string, any> = {
  'Phone Call': Phone,
  'Cold Email': Mail,
  'Follow-up Email': Mail,
  'WhatsApp Business Message': MessageSquare,
  'LinkedIn Message': MessageSquare,
  'Other Business Message': MessageSquare,
  'In-Person Visit': MapPin,
  'Discovery Meeting': Clock,
  'Follow-up Meeting': Clock,
  'Proposal Discussion': FileText,
  'Internal Coordination': FileText,
  'General Note': FileText
};

export function ActivityTimeline({ leadId, businessId }: { leadId: string; businessId?: string }) {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activityType, setActivityType] = useState('Phone Call');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  useEffect(() => {
    fetchActivities();
  }, [leadId]);

  async function fetchActivities() {
    setLoading(true);
    const { data } = await supabase
      .from('sales_activities')
      .select('id, activity_type, outcome, notes, next_action, next_follow_up, created_at, profiles(username)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    if (data) setActivities(data as any);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('sales_activities').insert({
      lead_id: leadId,
      business_id: businessId || null,
      created_by: profile.id,
      activity_type: activityType,
      outcome: outcome || null,
      notes: notes || null,
      next_action: nextAction || null,
      next_follow_up: nextFollowUp || null
    });
    if (!error) {
      setOutcome('');
      setNotes('');
      setNextAction('');
      setNextFollowUp('');
      setShowSheet(false);
      fetchActivities();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-bold flex items-center gap-2"><Clock size={16} /> Activity</h4>
        <button onClick={() => setShowSheet(true)} className="text-[13px] font-semibold text-brand-primary flex items-center gap-1">
          <Plus size={16} /> Log
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-brand-primary" size={20} /></div>
      ) : activities.length === 0 ? (
        <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">No activity yet.</p>
      ) : (
        <div className="space-y-3 relative border-l-2 border-surface-borderLight dark:border-surface-borderDark ml-2 pl-4">
          {activities.map(a => {
            const Icon = ICONS[a.activity_type] || FileText;
            return (
              <div key={a.id} className="relative">
                <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-brand-primary rounded-full border-2 border-surface-cardLight dark:border-surface-cardDark"></div>
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-brand-primary" />
                  <p className="text-[13px] font-semibold">{a.activity_type}</p>
                </div>
                {a.outcome && <p className="text-[12px] font-medium text-text-secondaryLight dark:text-text-secondaryDark">Outcome: {a.outcome}</p>}
                {a.notes && <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">{a.notes}</p>}
                <p className="text-[11px] text-text-secondaryLight dark:text-text-secondaryDark mt-0.5">
                  by {a.profiles?.username} • {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <BottomSheet isOpen={showSheet} onClose={() => setShowSheet(false)} title="Log Activity">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold mb-1">Type</label>
            <select value={activityType} onChange={e => setActivityType(e.target.value)} className="input-field w-full">
              {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1">Outcome</label>
            <select value={outcome} onChange={e => setOutcome(e.target.value)} className="input-field w-full">
              <option value="">—</option>
              {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="input-field w-full" rows={3} />
          <input type="text" placeholder="Next action" value={nextAction} onChange={e => setNextAction(e.target.value)} className="input-field w-full" />
          <input type="date" value={nextFollowUp} onChange={e => setNextFollowUp(e.target.value)} className="input-field w-full" />
          <button type="submit" disabled={saving} className="w-full h-[44px] bg-brand-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70">
            {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Activity'}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
