import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Loader2 } from 'lucide-react';

type Update = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string };
};

export default function Updates() {
  const { profile } = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchUpdates();

    const subscription = supabase
      .channel('public:updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'updates' }, () => {
        fetchUpdates();
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  async function fetchUpdates() {
    const { data, error } = await supabase
      .from('updates')
      .select(`id, title, content, created_at, profiles (username, avatar_url)`)
      .order('created_at', { ascending: false });

    if (!error && data) setUpdates(data as any);
    setLoading(false);
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content) return;
    setIsPosting(true);
    const { error } = await supabase.from('updates').insert({
      title,
      content,
      team_id: profile?.team_id,
      author_id: profile?.id
    });
    if (!error) {
      setTitle('');
      setContent('');
      setShowForm(false);
    }
    setIsPosting(false);
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Updates</h1>
        {profile?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-primary text-brand-secondary px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-brand-accent transition">
            <PlusCircle size={18} /> Post Update
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handlePost} className="bg-white dark:bg-brand-cardDark p-4 rounded-2xl shadow-sm border border-brand-borderLight dark:border-brand-borderDark mb-6 space-y-4">
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-brand-borderLight dark:border-brand-borderDark bg-transparent text-brand-secondary dark:text-white" required />
          <textarea placeholder="What's the update?" value={content} onChange={e => setContent(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-brand-borderLight dark:border-brand-borderDark bg-transparent text-brand-secondary dark:text-white" rows={3} required />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
            <button type="submit" disabled={isPosting} className="bg-brand-primary text-brand-secondary px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
              {isPosting ? <Loader2 className="animate-spin" size={18} /> : 'Post'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {updates.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No updates yet. Check back later!</p>
        ) : (
          updates.map(update => (
            <div key={update.id} className="bg-white dark:bg-brand-cardDark p-5 rounded-2xl shadow-sm border border-brand-borderLight dark:border-brand-borderDark">
              <div className="flex items-center gap-3 mb-3">
                <img src={update.profiles?.avatar_url} alt="Author" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                <div>
                  <p className="font-semibold text-sm text-brand-secondary dark:text-white">{update.profiles?.username}</p>
                  <p className="text-xs text-gray-500">{new Date(update.created_at).toLocaleString()}</p>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1 text-brand-secondary dark:text-white">{update.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{update.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
