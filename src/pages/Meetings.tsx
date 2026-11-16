import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { localToday } from '../lib/date';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Calendar, Clock, MapPin, Video, CheckCircle2, X } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox, SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Meeting = {
  id: string;
  title: string;
  meeting_type: string | null;
  meeting_date: string;
  start_time: string;
  end_time: string | null;
  timezone: string;
  meeting_link: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  outcome: string | null;
  assigned_to: string;
};

const TERMINAL_STATUSES = ['Completed', 'Cancelled', 'No Show'];

function statusBadgeClass(s: string) {
  if (s === 'Confirmed' || s === 'Completed') return 'badge-success';
  if (s === 'Cancelled' || s === 'No Show') return 'badge-danger';
  if (s === 'Awaiting Confirmation') return 'badge-warning';
  if (s === 'Rescheduled') return 'badge-neutral';
  return 'badge-info';
}

export default function Meetings() {
  const { profile } = useAuth();
  const toast = useToast();
  const routerLocation = useLocation();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const [leadId, setLeadId] = useState('');
  const [leads, setLeads] = useState<{ id: string; name: string }[]>([]);

  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState('Discovery');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [link, setLink] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchMeetings();
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

  async function fetchMeetings() {
    setLoading(true);
    const { data } = await supabase
      .from('meetings')
      .select('id, title, meeting_type, meeting_date, start_time, end_time, timezone, meeting_link, location, status, notes, outcome, assigned_to')
      .order('meeting_date', { ascending: false });
    if (data) setMeetings(data as any);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title || !meetingDate || !startTime) return;
    setSaving(true);
    const { error } = await supabase.from('meetings').insert({
      lead_id: leadId || null,
      title,
      meeting_type: meetingType || null,
      meeting_date: meetingDate,
      start_time: startTime,
      end_time: endTime || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      meeting_link: link || null,
      location: location || null,
      status: 'Proposed',
      notes: notes || null,
      created_by: profile.id,
      assigned_to: profile.id,
    });
    if (!error) {
      toast.success('Meeting scheduled');
      setLeadId(''); setTitle(''); setMeetingType('Discovery'); setMeetingDate(''); setStartTime('');
      setEndTime(''); setLink(''); setLocation(''); setNotes('');
      setShowSheet(false);
      fetchMeetings();
    } else {
      toast.error('Could not schedule meeting');
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    const { error } = await supabase.from('meetings').update({ status }).eq('id', id);
    if (!error) {
      toast.success(
        status === 'Confirmed' ? 'Meeting confirmed'
          : status === 'Completed' ? 'Meeting completed'
          : status === 'Cancelled' ? 'Meeting cancelled'
          : 'Meeting updated'
      );
      await fetchMeetings();
    } else {
      toast.error('Failed to update meeting');
    }
    setUpdatingId(null);
  }

  const today = localToday();
  const filtered = meetings.filter(m => tab === 'upcoming' ? m.meeting_date >= today : m.meeting_date < today);
  const upcomingCount = meetings.filter(m => m.meeting_date >= today).length;
  const pastCount = meetings.filter(m => m.meeting_date < today).length;

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-28 rounded-xl" />
        </div>
        <div className="flex gap-1.5 mb-5">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-20 rounded-xl" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Meetings</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {upcomingCount} upcoming · {pastCount} past
          </p>
        </div>
        <button onClick={() => setShowSheet(true)} className="btn-primary shrink-0">
          <Plus size={18} strokeWidth={2.5} /> New Meeting
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        <button
          onClick={() => setTab('upcoming')}
          className={tab === 'upcoming' ? 'chip-active' : 'chip'}
        >
          Upcoming
          <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{upcomingCount}</span>
        </button>
        <button
          onClick={() => setTab('past')}
          className={tab === 'past' ? 'chip-active' : 'chip'}
        >
          Past
          <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{pastCount}</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Calendar size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">No {tab} meetings</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {tab === 'upcoming'
              ? 'Schedule a meeting with a prospect to see it here.'
              : 'Completed meetings will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => {
            const canAct = !TERMINAL_STATUSES.includes(m.status);
            const dateLabel = new Date(m.meeting_date).toLocaleDateString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric',
            });
            const timeLabel = m.start_time.slice(0, 5) + (m.end_time ? '–' + m.end_time.slice(0, 5) : '');
            return (
              <div key={m.id} className="card p-3.5 md:p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-semibold tracking-tight leading-snug truncate">{m.title}</h3>
                    {m.meeting_type && (
                      <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark truncate">
                        {m.meeting_type}
                      </p>
                    )}
                  </div>
                  <span className={statusBadgeClass(m.status) + ' shrink-0'}>{m.status}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">
                  <span className="flex items-center gap-1 shrink-0">
                    <Calendar size={13} className="shrink-0" /> {dateLabel}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock size={13} className="shrink-0" /> {timeLabel}
                  </span>
                  {m.location && (
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </span>
                  )}
                </div>

                {m.meeting_link && (
                  <a
                    href={m.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold text-brand-primary hover:text-brand-primaryHover"
                  >
                    <Video size={13} /> Join meeting
                  </a>
                )}

                {canAct && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-surface-borderLight dark:border-surface-borderDark">
                    <button
                      onClick={() => updateStatus(m.id, 'Confirmed')}
                      disabled={updatingId === m.id}
                      className="flex-1 h-[38px] rounded-lg bg-state-successSoft text-state-success text-[12px] font-semibold flex items-center justify-center gap-1 active:scale-[0.97] transition-transform disabled:opacity-50"
                    >
                      {updatingId === m.id ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Confirm</>}
                    </button>
                    <button
                      onClick={() => updateStatus(m.id, 'Completed')}
                      disabled={updatingId === m.id}
                      className="flex-1 h-[38px] rounded-lg bg-brand-primary text-black text-[12px] font-semibold flex items-center justify-center gap-1 active:scale-[0.97] transition-transform disabled:opacity-50"
                    >
                      {updatingId === m.id ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle2 size={14} /> Complete</>}
                    </button>
                    <button
                      onClick={() => updateStatus(m.id, 'Cancelled')}
                      disabled={updatingId === m.id}
                      className="flex-1 h-[38px] rounded-lg bg-state-dangerSoft text-state-danger text-[12px] font-semibold flex items-center justify-center gap-1 active:scale-[0.97] transition-transform disabled:opacity-50"
                    >
                      {updatingId === m.id ? <Loader2 size={14} className="animate-spin" /> : <><X size={14} /> Cancel</>}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <BottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title="New Meeting"
        footer={
          <button type="submit" form="new-meeting-form" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Meeting'}
          </button>
        }
      >
        <form id="new-meeting-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Link to Lead</label>
            <select value={leadId} onChange={e => setLeadId(e.target.value)} className="input-field">
              <option value="">None</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Discovery call with ABC"
              required
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Type</label>
            <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className="input-field">
              <option value="Discovery">Discovery</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Proposal Discussion">Proposal Discussion</option>
              <option value="Internal">Internal</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Date *</label>
            <input
              type="date"
              value={meetingDate}
              onChange={e => setMeetingDate(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1.5">Start *</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">End</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Meeting link</label>
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              className="input-field"
              placeholder="https://zoom.us/j/…"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="input-field"
              placeholder="Office, address…"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field"
              placeholder="Optional agenda"
              rows={2}
            />
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
