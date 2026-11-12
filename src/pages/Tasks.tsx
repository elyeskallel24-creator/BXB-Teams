import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Check, CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox, SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  due_time: string | null;
  status: string;
  assigned_to: string;
  lead_id: string | null;
  created_at: string;
  leads: { businesses: { name: string } | null } | null;
};

type Tab = 'today' | 'overdue' | 'upcoming' | 'completed';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function priorityBadgeClass(p: string) {
  if (p === 'Urgent') return 'badge-danger';
  if (p === 'High') return 'badge-warning';
  if (p === 'Low') return 'badge-info';
  return 'badge-neutral';
}

export default function Tasks() {
  const { profile } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('today');

  const [leadId, setLeadId] = useState('');
  const [leads, setLeads] = useState<{ id: string; name: string }[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  useEffect(() => {
    fetchTasks();
    async function fetchLeadsList() {
      const { data } = await supabase.from('leads').select('id, businesses(name)');
      if (data) setLeads(data.map((l: any) => ({ id: l.id, name: l.businesses?.name || 'Unnamed' })));
    }
    fetchLeadsList();
  }, []);

  useEffect(() => {
    const state = (location.state as any) || {};
    if (state.openCreate) {
      setShowSheet(true);
      if (state.leadId) setLeadId(state.leadId);
    }
  }, [location.state]);

  async function fetchTasks() {
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('id, title, description, priority, due_date, due_time, status, assigned_to, lead_id, created_at, leads(businesses(name))')
      .order('due_date', { ascending: true });
    if (data) setTasks(data as any);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title) return;
    setSaving(true);
    const { error } = await supabase.from('tasks').insert({
      lead_id: leadId || null,
      title,
      description: description || null,
      priority,
      due_date: dueDate || null,
      due_time: dueTime || null,
      status: 'Pending',
      assigned_to: profile.id,
      created_by: profile.id,
    });
    if (!error) {
      toast.success('Task created');
      setTitle(''); setDescription(''); setPriority('Medium'); setDueDate(''); setDueTime(''); setLeadId('');
      setShowSheet(false);
      fetchTasks();
    } else {
      toast.error('Could not create task');
    }
    setSaving(false);
  }

  async function toggleComplete(task: Task) {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: newStatus === 'Completed' ? new Date().toISOString() : null })
      .eq('id', task.id);
    if (!error) {
      toast.success(newStatus === 'Completed' ? 'Task completed' : 'Task reopened');
      await fetchTasks();
    } else {
      toast.error('Failed to update task');
    }
  }

  const today = new Date().toISOString().split('T')[0];

  const filtered = tasks.filter(t => {
    if (activeTab === 'completed') return t.status === 'Completed';
    if (t.status === 'Completed' || t.status === 'Cancelled') return false;
    if (activeTab === 'today') return t.due_date === today;
    if (activeTab === 'overdue') return !!t.due_date && t.due_date < today;
    if (activeTab === 'upcoming') return !!t.due_date && t.due_date > today;
    return true;
  });

  const active = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
  const counts = {
    today: active.filter(t => t.due_date === today).length,
    overdue: active.filter(t => !!t.due_date && t.due_date < today).length,
    upcoming: active.filter(t => !!t.due_date && t.due_date > today).length,
    completed: tasks.filter(t => t.status === 'Completed').length,
  };

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'today', label: 'Today', icon: Clock },
    { key: 'overdue', label: 'Overdue', icon: AlertTriangle },
    { key: 'upcoming', label: 'Upcoming', icon: ListTodo },
    { key: 'completed', label: 'Done', icon: CheckCircle2 },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-28 rounded-xl" />
        </div>
        <div className="flex gap-1.5 mb-5">
          {[0, 1, 2, 3].map(i => <SkeletonBox key={i} className="h-9 w-20 rounded-xl" />)}
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Tasks</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {counts.today} due today · {counts.overdue} overdue
          </p>
        </div>
        <button onClick={() => setShowSheet(true)} className="btn-primary shrink-0">
          <Plus size={18} strokeWidth={2.5} /> New Task
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? 'chip-active' : 'chip'}
          >
            <tab.icon size={14} />
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <ListTodo size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">
            {activeTab === 'overdue'
              ? 'No overdue tasks'
              : activeTab === 'completed'
                ? 'Nothing completed yet'
                : activeTab === 'today'
                  ? 'No tasks for today'
                  : 'Nothing upcoming'}
          </h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {activeTab === 'overdue'
              ? 'You are on top of everything.'
              : activeTab === 'completed'
                ? 'Complete a task to see it here.'
                : 'Create a task to stay on top of your follow-ups.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const completed = task.status === 'Completed';
            const overdue = !!task.due_date && task.due_date < today && !completed;
            return (
              <div key={task.id} className="card p-3">
                <div className="flex items-start gap-1">
                  <button
                    onClick={() => toggleComplete(task)}
                    aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
                    className="shrink-0 flex items-center justify-center w-11 h-11 -ml-2 -mt-1.5 rounded-full active:bg-black/5 dark:active:bg-white/5"
                  >
                    <span
                      className={
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ' +
                        (completed
                          ? 'bg-brand-primary border-brand-primary'
                          : 'border-surface-borderLight dark:border-surface-borderDark')
                      }
                    >
                      {completed && <Check size={12} className="text-black" strokeWidth={3} />}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-start gap-2 mb-1">
                      <h3
                        className={
                          'text-[14px] font-semibold tracking-tight leading-snug flex-1 min-w-0 ' +
                          (completed ? 'line-through opacity-50' : '')
                        }
                      >
                        {task.title}
                      </h3>
                      <span className={priorityBadgeClass(task.priority) + ' shrink-0'}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark line-clamp-2 mb-1.5">
                        {task.description}
                      </p>
                    )}

                    {(task.due_date || task.leads?.businesses?.name) && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                        {task.due_date && (
                          <span
                            className={
                              overdue
                                ? 'text-state-danger font-semibold'
                                : 'text-text-mutedLight dark:text-text-mutedDark'
                            }
                          >
                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {task.due_time && ` · ${task.due_time.slice(0, 5)}`}
                          </span>
                        )}
                        {task.leads?.businesses?.name && (
                          <span className="text-text-mutedLight dark:text-text-mutedDark truncate">
                            · {task.leads.businesses.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title="New Task"
        footer={
          <button type="submit" form="new-task-form" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Task'}
          </button>
        }
      >
        <form id="new-task-form" onSubmit={handleCreate} className="space-y-4">
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
              placeholder="e.g. Call back ABC Corp"
              required
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-field"
              placeholder="Optional details"
              rows={2}
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="input-field">
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1.5">Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Due time</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="input-field" />
            </div>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
