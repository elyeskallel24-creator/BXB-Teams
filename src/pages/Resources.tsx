import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, FileText, Search, Bookmark, BookmarkCheck, Download, Trash2, Folder } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { SkeletonBox } from '../components/Skeleton';
import { useToast } from '../components/Toast';

type Resource = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  file_path: string;
  file_size: number;
  created_at: string;
  author_id: string;
};

const CATEGORIES = [
  'Company', 'Sales Training', 'Playbooks', 'Templates',
  'Brochures', 'Portfolio', 'Video', 'Technical', 'Internal',
];

function fmtSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function Resources() {
  const { profile } = useAuth();
  const toast = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Sales Training');
  const [file, setFile] = useState<File | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [resRes, bmRes] = await Promise.all([
      supabase.from('resources').select('id, title, description, category, file_path, file_size, created_at, author_id').is('deleted_at', null).order('created_at', { ascending: false }),
      profile ? supabase.from('saved_resources').select('resource_id').eq('user_id', profile.id) : Promise.resolve({ data: [] })
    ]);
    if (resRes.data) setResources(resRes.data as any);
    if (bmRes.data) setBookmarks(new Set((bmRes.data as any[]).map(b => b.resource_id)));
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !file || !title) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('File must be under 50 MB'); return; }
    setSaving(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = profile.team_id + '/' + Date.now() + '-' + safeName;
    const up = await supabase.storage.from('resources').upload(path, file);
    if (up.error) { toast.error('Upload failed: ' + up.error.message); setSaving(false); return; }
    const ins = await supabase.from('resources').insert({
      team_id: profile.team_id,
      author_id: profile.id,
      title,
      description: description || null,
      category: newCategory || null,
      file_path: path,
      file_size: file.size,
    });
    if (ins.error) { toast.error('Could not save record'); setSaving(false); return; }
    toast.success('Resource uploaded');
    setTitle(''); setDescription(''); setNewCategory('Sales Training'); setFile(null);
    setShowSheet(false);
    fetchAll();
    setSaving(false);
  }

  async function openResource(r: Resource) {
    setOpeningId(r.id);
    const { data, error } = await supabase.storage.from('resources').createSignedUrl(r.file_path, 3600);
    if (error || !data?.signedUrl) {
      toast.error('Could not open file');
    } else {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }
    setOpeningId(null);
  }

  async function toggleBookmark(r: Resource) {
    if (!profile) return;
    const isBm = bookmarks.has(r.id);
    const next = new Set(bookmarks);
    if (isBm) next.delete(r.id); else next.add(r.id);
    setBookmarks(next);
    if (isBm) {
      const { error } = await supabase.from('saved_resources').delete().eq('user_id', profile.id).eq('resource_id', r.id);
      if (error) { toast.error('Could not remove bookmark'); setBookmarks(new Set(bookmarks)); }
    } else {
      const { error } = await supabase.from('saved_resources').insert({ user_id: profile.id, resource_id: r.id });
      if (error) { toast.error('Could not save bookmark'); setBookmarks(new Set(bookmarks)); }
    }
  }

  async function handleDelete(r: Resource) {
    if (!confirm('Archive this resource? It will be hidden from members but the file remains in storage.')) return;
    const { error } = await supabase.from('resources').update({ deleted_at: new Date().toISOString() }).eq('id', r.id);
    if (error) { toast.error('Could not archive'); return; }
    toast.success('Resource archived');
    fetchAll();
  }

  const categories = Array.from(new Set(resources.map(r => r.category).filter(Boolean))).sort() as string[];

  const filtered = resources.filter(r => {
    if (showBookmarks && !bookmarks.has(r.id)) return false;
    if (category !== 'All' && r.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.title.toLowerCase().includes(q) &&
        !(r.description || '').toLowerCase().includes(q) &&
        !(r.category || '').toLowerCase().includes(q)
      ) return false;
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
        <SkeletonBox className="h-11 w-full rounded-xl mb-3" />
        <div className="flex gap-1.5 mb-5">
          {[0,1,2,3,4].map(i => <SkeletonBox key={i} className="h-9 w-20 rounded-xl" />)}
        </div>
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
          <h1 className="page-title">Resources</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            {resources.length} file{resources.length === 1 ? '' : 's'} · {bookmarks.size} saved
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowSheet(true)} className="btn-primary shrink-0">
            <Plus size={18} strokeWidth={2.5} /> Upload
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" size={18} />
        <input
          type="text"
          placeholder="Search resources..."
          className="input-field pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-6 px-6 pb-1 mb-5 scrollbar-hide">
        <button onClick={() => { setShowBookmarks(false); setCategory('All'); }} className={!showBookmarks && category === 'All' ? 'chip-active' : 'chip'}>
          All
          <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{resources.length}</span>
        </button>
        <button onClick={() => setShowBookmarks(true)} className={showBookmarks ? 'chip-active' : 'chip'}>
          <Bookmark size={13} /> Saved
          {bookmarks.size > 0 && <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">{bookmarks.size}</span>}
        </button>
        {categories.map(c => (
          <button key={c} onClick={() => { setShowBookmarks(false); setCategory(c); }} className={!showBookmarks && category === c ? 'chip-active' : 'chip'}>
            {c}
            <span className="ml-0.5 opacity-70 font-mono text-[11px] tabular-nums">
              {resources.filter(r => r.category === c).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 mx-auto text-brand-primary">
            <Folder size={28} />
          </div>
          <h3 className="text-[16px] font-bold mb-1">
            {showBookmarks ? 'No saved resources' : search ? 'No matching files' : 'No resources yet'}
          </h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[260px] mx-auto">
            {showBookmarks ? 'Bookmark resources to find them here quickly.' : search ? 'Try a different search term or category.' : isAdmin ? 'Upload your first PDF from the button above.' : 'Ask your admin to upload sales material.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const isBm = bookmarks.has(r.id);
            return (
              <div key={r.id} className="card p-3 flex items-start gap-3">
                <button
                  onClick={() => openResource(r)}
                  disabled={openingId === r.id}
                  className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 hover:bg-brand-primary/20 transition-colors disabled:opacity-50"
                  aria-label={'Open ' + r.title}
                >
                  {openingId === r.id ? <Loader2 size={16} className="animate-spin" /> : <FileText size={18} />}
                </button>
                <button onClick={() => openResource(r)} className="flex-1 min-w-0 text-left">
                  <h3 className="text-[14px] font-semibold tracking-tight leading-snug truncate">{r.title}</h3>
                  {r.description && (
                    <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark line-clamp-2 mb-1">{r.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                    {r.category && <span className="badge-neutral">{r.category}</span>}
                    <span className="text-text-mutedLight dark:text-text-mutedDark font-mono tabular-nums">{fmtSize(r.file_size)}</span>
                  </div>
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => toggleBookmark(r)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg active:bg-black/5 dark:active:bg-white/5 transition-colors"
                    aria-label={isBm ? 'Remove bookmark' : 'Save'}
                  >
                    {isBm ? <BookmarkCheck size={16} className="text-brand-primary" /> : <Bookmark size={16} className="text-text-mutedLight dark:text-text-mutedDark" />}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(r)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg active:bg-state-dangerSoft text-text-mutedLight dark:text-text-mutedDark hover:text-state-danger transition-colors"
                      aria-label="Archive"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomSheet
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title="Upload Resource"
        footer={
          <button type="submit" form="upload-resource" disabled={saving} className="btn-primary w-full">
            {saving ? <><Loader2 className="animate-spin" size={16} /> Uploading…</> : <><Download size={16} /> Upload PDF</>}
          </button>
        }
      >
        <form id="upload-resource" onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="e.g. BXB Services Overview 2026" required />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="Short description shown in the list" rows={2} />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Category</label>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input-field">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow block mb-1.5">PDF file * (max 50 MB)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="input-field file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:text-black file:font-semibold file:px-3 file:py-1.5 file:text-[12px]"
              required
            />
            {file && <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mt-1">{file.name} · {fmtSize(file.size)}</p>}
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
