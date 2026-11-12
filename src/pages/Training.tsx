import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, GraduationCap, Search, CheckCircle2, Clock, PlayCircle, FileText, ChevronRight } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Module = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  estimated_minutes: number;
  sort_order: number;
  is_active: boolean;
};
type Progress = {
  module_id: string;
  status: string;
  completed_at: string | null;
};

const EMPTY_FORM = {
  title: '', description: '', category: 'General', content: '',
  video_url: '', pdf_url: '', estimated_minutes: '15', sort_order: '0', is_active: true,
};
type FormState = typeof EMPTY_FORM;

export default function Training() {
  const { profile } = useAuth();
  const toast = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [selected, setSelected] = useState<Module | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { fetchAll(); }, [profile]);

  async function fetchAll() {
    setLoading(true);
    const [m, p] = await Promise.all([
      supabase.from('training_modules').select('*').order('sort_order').order('title'),
      profile ? supabase.from('training_progress').select('module_id, status, completed_at').eq('user_id', profile.id) : Promise.resolve({ data: [] }),
    ]);
    if (m.data) setModules(m.data as any);
    const pm: Record<string, Progress> = {};
    ((p.data || []) as Progress[]).forEach(r => { pm[r.module_id] = r; });
    setProgressMap(pm);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !form.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('training_modules').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || 'General',
      content: form.content.trim() || null,
      video_url: form.video_url.trim() || null,
      pdf_url: form.pdf_url.trim() || null,
      estimated_minutes: parseInt(form.estimated_minutes, 10) || 15,
      sort_order: parseInt(form.sort_order, 10) || 0,
      is_active: form.is_active,
      created_by: profile.id,
    });
    if (!error) {
      toast.success('Module created');
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchAll();
    } else {
      toast.error('Could not create module');
    }
    setSaving(false);
  }

  async function markComplete(m: Module) {
    if (!profile) return;
    setCompleting(true);
    const existing = progressMap[m.id];
    const payload = {
      status: 'Completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = existing
      ? await supabase.from('training_progress').update(payload).eq('user_id', profile.id).eq('module_id', m.id)
      : await supabase.from('training_progress').insert({ user_id: profile.id, module_id: m.id, ...payload });
    if (!error) {
      toast.success('Marked complete');
      fetchAll();
    } else {
      toast.error('Could not save progress');
    }
    setCompleting(false);
  }

  const categories = Array.from(new Set(modules.map(m => m.category))).sort();
  const completedCount = modules.filter(m => progressMap[m.id]?.status === 'Completed').length;
  const totalCount = modules.length;
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filtered = modules.filter(m => {
    if (!isAdmin && !m.is_active) return false;
    if (category !== 'All' && m.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.title.toLowerCase().includes(q) && !(m.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-24 rounded-xl" />
        </div>
        <SkeletonBox className="h-20 rounded-2xl mb-4" />
        <div className="space-y-2">
          {[0,1,2,3].map(i => <SkeletonBox key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Training</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }} className="btn-primary shrink-0">
            <Plus size={18} strokeWidth={2.5} /> New Module
          </button>
        )}
      </div>

      {totalCount > 0 && (
        <div className="card p-3 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="eyebrow">Your progress</span>
            <span className="font-mono tabular-nums font-semibold text-[13px]">{completedCount} / {totalCount}</span>
          </div>
          <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
            <div className="h-full bg-brand-primary transition-all" style={{ width: overallPct + '%' }} />
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input type="text" placeholder="Search modules..." className="input-field pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
          <button onClick={() => setCategory('All')} className={category === 'All' ? 'chip-active' : 'chip'}>
            All
            <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{modules.length}</span>
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={category === c ? 'chip-active' : 'chip'}>
              {c}
              <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{modules.filter(m => m.category === c).length}</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <GraduationCap size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">{search ? 'No matching modules' : 'No training modules yet'}</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {search ? 'Try a different search.' : isAdmin ? 'Add your first training module.' : 'Your admin has not added modules yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => {
            const p = progressMap[m.id];
            const done = p?.status === 'Completed';
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="card p-3 w-full text-left flex items-start gap-3 hover:border-brand-primary/30 active:scale-[0.995] transition-all"
              >
                <div className={'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ' + (done ? 'bg-state-successSoft text-state-success' : 'bg-brand-primary/10 text-brand-primary')}>
                  {done ? <CheckCircle2 size={18} /> : <GraduationCap size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className={'text-[14px] font-semibold tracking-tight leading-snug flex-1 min-w-0 truncate ' + (done ? 'opacity-70' : '')}>{m.title}</h3>
                    <ChevronRight size={16} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
                  </div>
                  {m.description && (
                    <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark line-clamp-2 mb-1.5">{m.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="badge-neutral">{m.category}</span>
                    <span className="text-text-mutedLight dark:text-text-mutedDark flex items-center gap-1 font-mono tabular-nums">
                      <Clock size={11} /> {m.estimated_minutes}m
                    </span>
                    {done ? (
                      <span className="badge-success">Completed</span>
                    ) : (
                      <span className="badge-neutral">Not started</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || 'Module'}>
        {selected && (() => {
          const done = progressMap[selected.id]?.status === 'Completed';
          return (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="badge-neutral">{selected.category}</span>
                <span className="badge-neutral">{selected.estimated_minutes} min</span>
                {done ? <span className="badge-success">Completed</span> : <span className="badge-neutral">Not started</span>}
              </div>

              {selected.description && (
                <div>
                  <p className="eyebrow mb-1.5">Overview</p>
                  <div className="card !p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{selected.description}</div>
                </div>
              )}

              {selected.content && (
                <div>
                  <p className="eyebrow mb-1.5">Content</p>
                  <div className="card !p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{selected.content}</div>
                </div>
              )}

              {selected.video_url && (
                <a href={selected.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 card !p-3 hover:border-brand-primary/30 transition-colors">
                  <PlayCircle size={18} className="text-brand-primary shrink-0" />
                  <span className="text-[13px] font-semibold text-brand-primary">Watch video</span>
                </a>
              )}

              {selected.pdf_url && (
                <a href={selected.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 card !p-3 hover:border-brand-primary/30 transition-colors">
                  <FileText size={18} className="text-brand-primary shrink-0" />
                  <span className="text-[13px] font-semibold text-brand-primary">Open PDF</span>
                </a>
              )}

              {!done && (
                <button onClick={() => markComplete(selected)} disabled={completing} className="btn-primary w-full">
                  {completing ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : <><CheckCircle2 size={16} /> Mark complete</>}
                </button>
              )}
            </div>
          );
        })()}
      </BottomSheet>

      <BottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Module"
        footer={
          <button type="submit" form="training-form" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : 'Create Module'}
          </button>
        }
      >
        <form id="training-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block mb-1.5">Category</label>
              <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Minutes</label>
              <input type="number" inputMode="numeric" value={form.estimated_minutes} onChange={e => setForm({ ...form, estimated_minutes: e.target.value })} className="input-field font-mono" />
            </div>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Written content</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="input-field" rows={4} />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Video URL</label>
            <input type="url" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} className="input-field" placeholder="https://…" />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">PDF URL</label>
            <input type="url" value={form.pdf_url} onChange={e => setForm({ ...form, pdf_url: e.target.value })} className="input-field" placeholder="https://…" />
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
