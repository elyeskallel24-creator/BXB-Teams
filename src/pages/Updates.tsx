import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Megaphone, Search, Eye, Trash2 } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Update = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  tag: string | null;
  created_at: string;
  author_id: string;
};

const TAGS = ['Announcement', 'Meeting', 'Product', 'Pricing', 'Urgent'] as const;

function tagBadgeClass(tag: string | null) {
  if (tag === 'Urgent') return 'badge-danger';
  if (tag === 'Pricing') return 'badge-warning';
  if (tag === 'Product') return 'badge-info';
  if (tag === 'Meeting') return 'badge-brand';
  return 'badge-neutral';
}

export default function Updates() {
  const { profile } = useAuth();
  const toast = useToast();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<string>('Announcement');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchUpdates();
    const channel = supabase
      .channel('updates-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'updates' }, () => fetchUpdates())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchUpdates() {
    const { data } = await supabase
      .from('updates')
      .select('id, title, content, image_url, tag, created_at, author_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setUpdates(data as any);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !title || !content) return;
    setSaving(true);
    const { error } = await supabase.from('updates').insert({
      team_id: profile.team_id,
      author_id: profile.id,
      title,
      content,
      tag,
    });
    if (!error) {
      toast.success('Update published');
      setTitle(''); setContent(''); setTag('Announcement');
      setShowSheet(false);
      fetchUpdates();
    } else {
      toast.error('Could not publish update');
    }
    setSaving(false);
  }

  async function handleDelete(u: Update) {
    if (!confirm('Archive this update? It will be hidden from the feed.')) return;
    const { error } = await supabase.from('updates').update({ deleted_at: new Date().toISOString() }).eq('id', u.id);
    if (error) { toast.error('Could not archive'); return; }
    toast.success('Update archived');
    fetchUpdates();
  }

  async function handleOpen(u: Update) {
    // Log view (fire-and-forget)
    if (profile) {
      supabase.rpc('log_views', { p_update_ids: [u.id] }).then(() => {});
    }
  }

  const filtered = updates.filter(u => {
    if (tagFilter !== 'All' && u.tag !== tagFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.title.toLowerCase().includes(q) && !u.content.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    All: updates.length,
    Urgent: updates.filter(u => u.tag === 'Urgent').length,
    Announcement: updates.filter(u => u.tag === 'Announcement').length,
    Meeting: updates.filter(u => u.tag === 'Meeting').length,
    Product: updates.filter(u => u.tag === 'Product').length,
    Pricing: updates.filter(u => u.tag === 'Pricing').length,
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <SkeletonBox className="h-8 w-32" />
          <SkeletonBox className="h-11 w-24 rounded-xl" />
        </div>
        <SkeletonBox className="h-11 w-full rounded-xl mb-3" />
        <div className="flex gap-1.5 mb-5">
          {[0,1,2,3,4].map(i => <SkeletonBox key={i} className="h-9 w-20 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[0,1,2].map(i => <SkeletonBox key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-5 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Updates</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {updates.length} post{updates.length === 1 ? '' : 's'}
            {counts.Urgent > 0 && ` · ${counts.Urgent} urgent`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowSheet(true)} className="btn-primary shrink-0">
            <Plus size={18} strokeWidth={2.5} /> Post
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input
          type="text"
          placeholder="Search updates..."
          className="input-field pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        {(['All', 'Urgent', 'Announcement', 'Meeting', 'Product', 'Pricing'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTagFilter(t)}
            className={tagFilter === t ? 'chip-active' : 'chip'}
          >
            {t}
            {counts[t] > 0 && <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{counts[t]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Megaphone size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">
            {search ? 'No matching updates' : tagFilter !== 'All' ? `No ${tagFilter.toLowerCase()} updates` : 'No updates yet'}
          </h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {search ? 'Try a different search term.' : tagFilter !== 'All' ? 'Switch to All to see every post.' : isAdmin ? 'Publish your first announcement from the button above.' : 'Announcements from your admin will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => (
            <article key={u.id} className="card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-[15px] font-bold tracking-tight leading-snug flex-1 min-w-0">{u.title}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  {u.tag && <span className={tagBadgeClass(u.tag)}>{u.tag}</span>}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(u)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg active:bg-state-dangerSoft text-text-mutedLight dark:text-text-mutedDark hover:text-state-danger transition-colors"
                      aria-label="Archive"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark leading-relaxed whitespace-pre-wrap mb-3">
                {u.content}
              </p>
              <button
                onClick={() => handleOpen(u)}
                className="inline-flex items-center gap-1 text-[11px] text-text-mutedLight dark:text-text-mutedDark hover:text-brand-primary transition-colors"
              >
                <Eye size={11} />
                {new Date(u.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </button>
            </article>
          ))}
        </div>
      )}

      <BottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title="New Update"
        footer={
          <button type="submit" form="new-update" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Publishing…</> : 'Publish'}
          </button>
        }
      >
        <form id="new-update" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="e.g. Q4 kickoff announcement" required />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Content *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} className="input-field" placeholder="Write the announcement…" rows={6} required />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Tag</label>
            <select value={tag} onChange={e => setTag(e.target.value)} className="input-field">
              {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
