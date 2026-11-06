import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { LogOut, Camera, Loader2 } from 'lucide-react';

export default function Profile() {
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [isEditing, setIsEditing] = useState(false);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    try {
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const size = Math.min(img.width, img.height);
      ctx?.drawImage(img, (img.width-size)/2, (img.height-size)/2, size, size, 0, 0, 256, 256);
      
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/webp', 0.8));
      if (!blob) throw new Error("Failed to process image");

      const filePath = profile!.id + '.webp';
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile!.id);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error uploading photo');
    } finally {
      setUploading(false);
    }
  }

  async function handleUsernameUpdate() {
    if (username.length < 3 || username.length > 20) {
      return alert('Username must be between 3 and 20 characters.');
    }
    const { error } = await supabase.from('profiles').update({ username }).eq('id', profile!.id);
    if (error) alert('Error updating username');
    else window.location.reload();
  }

  return (
    <div className="animate-enter space-y-6">
      <h1 className="page-title">Profile</h1>
      
      <div className="card flex flex-col items-center text-center space-y-4 py-8 relative">
        <div className="relative group cursor-pointer">
          <img src={profile?.avatar_url} alt="You" className="w-20 h-20 rounded-full object-cover bg-gray-200 shadow-sm" />
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? <Loader2 className="animate-spin text-white" size={20} /> : <Camera className="text-white" size={20} />}
          </div>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
          <div className="absolute -bottom-1 -right-1 bg-brand-primary text-black p-1.5 rounded-full shadow-md pointer-events-none">
            <Camera size={12} />
          </div>
        </div>

        <div className="w-full max-w-[240px] mt-2">
          {isEditing ? (
            <div className="space-y-2">
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field text-center" placeholder="New username" />
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1 py-1.5 text-[13px] h-9">Cancel</button>
                <button onClick={handleUsernameUpdate} className="btn-primary flex-1 py-1.5 text-[13px] h-9">Save</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-[20px] font-bold">{profile?.username}</h2>
              <button onClick={() => setIsEditing(true)} className="text-text-secondaryLight dark:text-text-secondaryDark hover:text-brand-primary transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              </button>
            </div>
          )}
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark mt-1">ID: {profile?.user_id_code}</p>
          <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary uppercase tracking-wider">
            {profile?.role}
          </span>
        </div>

        <button onClick={() => supabase.auth.signOut()} className="btn-secondary mt-4 text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/30 h-10 text-[14px]">
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
}