import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Loader2, MessageSquare, Plus } from 'lucide-react';

type Update = {
  id: string;
  title: string;
  content: string;
  tag: string | null;
  image_url: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string };
};

const tagColors: Record<string, string> = {
  Meeting: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Product: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Pricing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Announcement: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Updates() {
  const { profile } = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('Announcement');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchUpdates();
    const subscription = supabase
      .channel('public:updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'updates' }, () => fetchUpdates())
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  async function fetchUpdates() {
    const { data, error } = await supabase
      .from('updates')
      .select(`id, title, content, tag, image_url, created_at, profiles (username, avatar_url)`)
      .order('created_at', { ascending: false });

    if (!error && data) setUpdates(data as any);
    setLoading(false);
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content) return;
    setIsPosting(true);
    const { error } = await supabase.from('updates').insert({
      title, content, tag, team_id: profile?.team_id, author_id: profile?.id
    });
    if (!error) {
      setTitle(''); setContent(''); setShowForm(false);
    }
    setIsPosting(false);
  }

  const groupedUpdates = updates.reduce((acc, update) => {
    const date = new Date(update.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (date.toDateString() === today.toDateString()) dateStr = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) dateStr = 'Yesterday';
    
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(update);
    return acc;
  }, {} as Record<string, Update[]>);

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-8" />
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded w-16" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full mb-1" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-enter">
      <div className="flex justify-between items-center mb-8">
        <h1 className="page-title mb-0">Updates</h1>
        {profile?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="hidden md:flex btn-primary">
            <PlusCircle size={18} /> Post Update
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handlePost} className="card mb-8 space-y-4 animate-enter">
          <input type="text" placeholder="Update Title" value={title} onChange={e => setTitle(e.target.value)} className="input-field" required />
          <textarea placeholder="What's the news?" value={content} onChange={e => setContent(e.target.value)} className="input-field" rows={4} required />
          <div className="flex gap-3">
            <select value={tag} onChange={e => setTag(e.target.value)} className="input-field flex-1">
              <option value="Announcement">Announcement</option>
              <option value="Meeting">Meeting</option>
              <option value="Product">Product</option>
              <option value="Pricing">Pricing</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isPosting} className="btn-primary">
              {isPosting ? <Loader2 className="animate-spin" size={18} /> : 'Publish'}
            </button>
          </div>
        </form>
      )}

      {updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-enter">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4 text-brand-primary">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">No updates yet</h3>
          <p className="text-text-secondaryLight dark:text-text-secondaryDark max-w-sm">
            When your admin posts news, meetings, or announcements, they will appear right here.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-surface-borderLight dark:border-surface-borderDark ml-4 md:ml-6 pl-6 md:pl-8 space-y-10 pb-10">
          {Object.entries(groupedUpdates).map(([date, items]) => (
            <div key={date} className="relative">
              <h3 className="absolute -left-[45px] md:-left-[53px] top-1 bg-surface-light dark:bg-surface-dark px-2 text-sm font-bold text-text-secondaryLight dark:text-text-secondaryDark uppercase tracking-wider">
                {date}
              </h3>
              <div className="space-y-6 pt-10">
                {items.map(update => (
                  <div key={update.id} className="card relative group animate-enter">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={update.profiles?.avatar_url} alt="Author" className="w-10 h-10 rounded-full object-cover bg-gray-200 shadow-sm" />
                        <div>
                          <p className="font-semibold text-sm">{update.profiles?.username}</p>
                          <p className="text-xs text-text-secondaryLight dark:text-text-secondaryDark">
                            {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {update.tag && (
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase ${tagColors[update.tag] || tagColors.Announcement}`}>
                          {update.tag}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold mb-2 tracking-tight">{update.title}</h2>
                    <p className="text-text-secondaryLight dark:text-text-secondaryDark leading-relaxed whitespace-pre-wrap">{update.content}</p>
                    {update.image_url && (
                      <img src={update.image_url} alt="Update attachment" className="mt-4 rounded-xl w-full object-cover max-h-96" loading="lazy" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Floating Action Button */}
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
