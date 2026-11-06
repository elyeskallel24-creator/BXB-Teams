import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Loader2, FileText, Download } from 'lucide-react';

type Resource = {
  id: string;
  title: string;
  description: string;
  category: string;
  file_path: string;
  file_size: number;
  created_at: string;
  profiles: { username: string; avatar_url: string };
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
      .select(`id, title, description, category, file_path, file_size, created_at, profiles (username, avatar_url)`)
      .order('created_at', { ascending: false });

    if (!error && data) setResources(data as any);
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !file) return;
    setIsUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${profile?.team_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('resources').upload(filePath, file);
    
    if (!uploadError) {
      const { error: dbError } = await supabase.from('resources').insert({
        title,
        description,
        category,
        file_path: filePath,
        file_size: file.size,
        team_id: profile?.team_id,
        author_id: profile?.id
      });
      
      if (!dbError) {
        setTitle('');
        setDescription('');
        setFile(null);
        setShowForm(false);
        fetchResources();
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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resources</h1>
        {profile?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-primary text-brand-secondary px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-brand-accent transition">
            <PlusCircle size={18} /> Upload PDF
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white dark:bg-brand-cardDark p-4 rounded-2xl shadow-sm border border-brand-borderLight dark:border-brand-borderDark mb-6 space-y-4">
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-brand-borderLight dark:border-brand-borderDark bg-transparent text-brand-secondary dark:text-white" required />
          <input type="text" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-brand-borderLight dark:border-brand-borderDark bg-transparent text-brand-secondary dark:text-white" />
          <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-brand-borderLight dark:border-brand-borderDark bg-transparent text-brand-secondary dark:text-white" required />
          <input type="file" accept=".pdf" required onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
            <button type="submit" disabled={isUploading} className="bg-brand-primary text-brand-secondary px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : 'Upload'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {resources.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No resources yet.</p>
        ) : (
          resources.map(res => (
            <div key={res.id} className="bg-white dark:bg-brand-cardDark p-5 rounded-2xl shadow-sm border border-brand-borderLight dark:border-brand-borderDark flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-secondary dark:text-white">{res.title}</h3>
                  <p className="text-sm text-gray-500 mb-1">{res.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{res.category}</span>
                    <span>{(res.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>{new Date(res.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDownload(res.file_path, res.title)} className="bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-primary/20 transition whitespace-nowrap">
                <Download size={18} /> Download
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
