import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Loader2, FileText, Download, Plus } from 'lucide-react';

type Resource = {
  id: string;
  title: string;
  description: string;
  category: string;
  file_path: string;
  file_size: number;
  created_at: string;
};

export default function Resources() {
  const { profile } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, description, category, file_path, file_size, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) setResources(data as any);
    setLoading(false);
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
      const { error: dbError } = await supabase.from('resources').insert({
        title, description, category, file_path: filePath, file_size: file.size, team_id: profile?.team_id, author_id: profile?.id
      });
      if (!dbError) {
        setTitle(''); setDescription(''); setFile(null); setShowForm(false); fetchResources();
      }
    }
    setIsUploading(false);
  }

  async function handleDownload(filePath: string, fileName: string) {
    const { data, error } = await supabase.storage.from('resources').createSignedUrl(filePath, 60);
    if (!error && data) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-8" />
        {[1, 2, 3].map(i => (
          <div key={i} className="card flex gap-4 items-center animate-pulse">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-8">
        <h1 className="page-title mb-0">Resources</h1>
        {profile?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="hidden md:flex btn-primary">
            <PlusCircle size={18} /> Upload PDF
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="card mb-8 space-y-4 animate-enter">
          <input type="text" placeholder="Document Title" value={title} onChange={e => setTitle(e.target.value)} className="input-field" required />
          <input type="text" placeholder="Short description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="input-field" />
          <input type="text" placeholder="Category (e.g. Sales, HR, Product)" value={category} onChange={e => setCategory(e.target.value)} className="input-field" required />
          <div className="relative">
            <input type="file" accept=".pdf" required onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-text-secondaryLight dark:text-text-secondaryDark file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 transition-colors cursor-pointer" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isUploading} className="btn-primary">
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : 'Upload'}
            </button>
          </div>
        </form>
      )}

      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-enter">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4 text-brand-primary">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">No files yet</h3>
          <p className="text-text-secondaryLight dark:text-text-secondaryDark max-w-sm">
            Uploaded PDFs, guides, and sales decks will appear here for the team to download.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {resources.map(res => (
            <div key={res.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-brand-primary/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight mb-1">{res.title}</h3>
                  {res.description && <p className="text-sm text-text-secondaryLight dark:text-text-secondaryDark mb-2">{res.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-text-secondaryLight dark:text-text-secondaryDark">
                    <span className="bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-black dark:text-white">{res.category}</span>
                    <span>{(res.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>{new Date(res.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDownload(res.file_path, res.title)} 
                className="btn-secondary sm:w-auto w-full shrink-0 group-hover:bg-brand-primary/5 group-hover:text-brand-primary group-hover:border-brand-primary/20"
              >
                <Download size={18} /> Open
              </button>
            </div>
          ))}
        </div>
      )}

      {profile?.role === 'admin' && (
        <button 
          onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-brand-primary text-black rounded-full shadow-float flex items-center justify-center z-40 active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}