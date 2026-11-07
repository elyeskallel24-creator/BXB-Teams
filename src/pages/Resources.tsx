import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, FileText, Plus, Search, Eye, Bookmark, BookmarkCheck } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';

type Resource = { id: string; title: string; description: string; category: string; file_path: string; file_size: number; created_at: string; };

export default function Resources() {
  const { profile } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => { 
    fetchResources(); 
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    fetchSaved();
  }, [profile?.id]);

  async function fetchResources() {
    const { data, error } = await supabase.from('resources').select('id, title, description, category, file_path, file_size, created_at').order('created_at', { ascending: false });
    if (!error && data) setResources(data as any);
    setLoading(false);
  }

  async function fetchSaved() {
    if (!profile?.id) return;
    const { data } = await supabase.from('saved_resources').select('resource_id').eq('user_id', profile.id);
    if (data) setSavedIds(new Set(data.map(d => d.resource_id)));
  }

  async function toggleSave(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (savedIds.has(id)) {
      await supabase.from('saved_resources').delete().match({ user_id: profile?.id, resource_id: id });
      const newSet = new Set(savedIds); newSet.delete(id); setSavedIds(newSet);
    } else {
      await supabase.from('saved_resources').insert({ user_id: profile?.id, resource_id: id });
      const newSet = new Set(savedIds); newSet.add(id); setSavedIds(newSet);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !file) return;
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = Math.random() + '.' + fileExt;
    const filePath = profile?.team_id + '/' + fileName;
    const { error: uploadError } = await supabase.storage.from('resources').upload(filePath, file);
    if (!uploadError) {
      const { error: dbError } = await supabase.from('resources').insert({ title, description, category, file_path: filePath, file_size: file.size, team_id: profile?.team_id, author_id: profile?.id });
      if (!dbError) { setTitle(''); setDescription(''); setFile(null); setShowSheet(false); fetchResources(); }
    }
    setIsUploading(false);
  }

  async function handleOpenPdf(filePath: string) {
    const { data, error } = await supabase.storage.from('resources').createSignedUrl(filePath, 300);
    if (!error && data) { 
      window.open(data.signedUrl, '_blank');
    }
  }

  const categories = ['All', 'Saved', ...Array.from(new Set(resources.map(r => r.category)))];
  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
      (selectedCategory === 'Saved' && savedIds.has(r.id)) || 
      (selectedCategory !== 'Saved' && r.category === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="space-y-4"><div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-6" />{[1, 2, 3].map(i => <div key={i} className="card flex gap-3 items-center animate-pulse"><div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0" /><div className="space-y-1.5 flex-1"><div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-1/3" /><div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" /></div></div>)}</div>;

  return (
    <div className="animate-enter">
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title mb-0">Resources</h1>
        {profile?.role === 'admin' && <button onClick={() => setShowSheet(true)} className="hidden md:flex btn-primary"><Plus size={18} /> Upload</button>}
      </div>

      <div className="space-y-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-text-secondaryLight dark:text-text-secondaryDark" size={18} />
          <input type="text" placeholder="Search..." className="input-field pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-3 py-1 rounded-full text-[13px] font-semibold transition ${selectedCategory === cat ? 'bg-brand-primary text-black' : 'bg-surface-cardLight dark:bg-surface-cardDark border border-surface-borderLight dark:border-surface-borderDark text-text-secondaryLight dark:text-text-secondaryDark'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-enter">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-3 text-brand-primary"><FileText size={28} /></div>
          <h3 className="text-[17px] font-bold mb-1">No files found</h3>
          <p className="text-[14px] text-text-secondaryLight dark:text-text-secondaryDark max-w-[240px]">Try adjusting your search or upload a new file.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResources.map(res => (
            <div key={res.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-brand-primary/30">
              <div className="flex items-start gap-3 w-full">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0"><FileText size={20} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-semibold tracking-tight mb-0.5 truncate">{res.title}</h3>
                  {res.description && <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark mb-1.5 line-clamp-2">{res.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-text-secondaryLight dark:text-text-secondaryDark">
                    <span className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-black dark:text-white">{res.category}</span>
                    <span>{(res.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="text-[10px]">&bull;</span>
                    <span>{new Date(res.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button 
                  onClick={(e) => toggleSave(res.id, e)} 
                  className={`w-9 h-9 flex items-center justify-center shrink-0 rounded-lg active:scale-90 transition-all duration-100 ${savedIds.has(res.id) ? 'text-brand-primary' : 'text-text-secondaryLight dark:text-text-secondaryDark hover:text-brand-primary'}`}
                >
                  {savedIds.has(res.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
                <button onClick={() => handleOpenPdf(res.file_path)} className="btn-secondary flex-1 sm:flex-none sm:w-auto shrink-0 group-hover:bg-brand-primary/5 group-hover:text-brand-primary group-hover:border-brand-primary/20"><Eye size={18} /> View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {profile?.role === 'admin' && (
        <button onClick={() => setShowSheet(true)} className="md:hidden fixed bottom-[calc(60px+16px+env(safe-area-inset-bottom,20px))] right-4 w-[52px] h-[52px] bg-brand-primary text-black rounded-full shadow-float flex items-center justify-center z-40 active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      )}

      <BottomSheet isOpen={showSheet} onClose={() => setShowSheet(false)} title="Upload Resource">
        <form onSubmit={handleUpload} className="space-y-4">
          <input type="text" placeholder="Document Title" value={title} onChange={e => setTitle(e.target.value)} className="input-field" required />
          <input type="text" placeholder="Short description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="input-field" />
          <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="input-field" required />
          <div className="relative"><input type="file" accept=".pdf" required onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-[14px] text-text-secondaryLight dark:text-text-secondaryDark file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[14px] file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 transition-colors cursor-pointer" /></div>
          <button type="submit" disabled={isUploading} className="btn-primary w-full mt-2">{isUploading ? <Loader2 className="animate-spin" size={18} /> : 'Upload'}</button>
        </form>
      </BottomSheet>
    </div>
  );
}
