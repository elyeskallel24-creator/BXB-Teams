import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Camera, LogOut, Save, Hash, User, Shield, Laptop, Smartphone } from 'lucide-react';
import { SkeletonBox } from '../components/Skeleton';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useToast } from '../components/Toast';

export default function Profile() {
  const { profile } = useAuth();
  const toast = useToast();
  const { isInstalled, promptInstall } = usePWAInstall();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [countryName, setCountryName] = useState('');
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || '');
    setAvatarUrl(profile.avatar_url || null);
    fetchTeam();
  }, [profile]);

  async function fetchTeam() {
    if (!profile) return;
    setLoading(true);
    const { data: team } = await supabase
      .from('teams')
      .select('name, country_id, countries(name)')
      .eq('id', profile.team_id)
      .maybeSingle();
    if (team) {
      setTeamName((team as any).name || '');
      setCountryName((team as any).countries?.name || '');
    }
    setPoints((profile as any).points || 0);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', profile.id);
    if (error) {
      toast.error('Could not save profile');
      setSaving(false);
    } else {
      toast.success('Profile updated');
      // Reload so the sidebar/header re-hydrates from Supabase
      setTimeout(() => window.location.reload(), 400);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only images allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5 MB');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = profile.id + '/avatar-' + Date.now() + '.' + ext;
    const up = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (up.error) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error } = await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id);
    if (error) {
      toast.error('Could not save avatar');
      setUploading(false);
    } else {
      toast.success('Avatar updated');
      setAvatarUrl(urlData.publicUrl);
      setTimeout(() => window.location.reload(), 400);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  if (!profile) return null;

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <SkeletonBox className="h-8 w-32 mb-5" />
        <div className="card p-4 mb-4 flex items-center gap-3">
          <SkeletonBox className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBox className="h-5 w-40" />
            <SkeletonBox className="h-3 w-32" />
          </div>
        </div>
        <SkeletonBox className="h-40 rounded-2xl mb-4" />
        <SkeletonBox className="h-12 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto animate-enter">
      <div className="mb-5 md:mb-6">
        <h1 className="page-title">Profile</h1>
        <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
          Your account details and avatar
        </p>
      </div>

      <div className="card !p-4 mb-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <img
            src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.username}
            alt=""
            className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5"
          />
          <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-primary text-black flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-transform">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-bold tracking-tight truncate">{profile.username}</h2>
          <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark font-mono tabular-nums">{profile.user_id_code}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={profile.role === 'admin' ? 'badge-brand' : 'badge-neutral'}>{profile.role}</span>
            {teamName && <span className="badge-neutral">{teamName}</span>}
            {countryName && <span className="badge-neutral">{countryName}</span>}
            {points > 0 && <span className="badge-success">{points} pts</span>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="card !p-4 mb-4 space-y-4">
        <div>
          <label className="eyebrow block mb-1.5">Username</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input-field pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="eyebrow block mb-1.5">User ID</label>
          <div className="relative">
            <Hash size={16} className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" />
            <input type="text" value={profile.user_id_code} className="input-field pl-10 font-mono bg-black/5 dark:bg-white/5" readOnly />
          </div>
          <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark mt-1">Contact your admin to change this.</p>
        </div>

        <div>
          <label className="eyebrow block mb-1.5">Role</label>
          <div className="relative">
            <Shield size={16} className="absolute left-3 top-3.5 text-text-mutedLight dark:text-text-mutedDark" />
            <input type="text" value={profile.role} className="input-field pl-10 capitalize bg-black/5 dark:bg-white/5" readOnly />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : <><Save size={16} /> Save Changes</>}
        </button>
      </form>

      {!isInstalled && (
        <div className="card !p-6 mb-4 flex flex-col items-center text-center bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)] border border-[var(--border)]">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B2C]/20 to-[#FF6B2C]/5 ring-1 ring-[#FF6B2C]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex items-center justify-center mb-4 text-[#FF6B2C]">
              <div className="flex items-center gap-2">
                <Laptop size={20} strokeWidth={2} />
                <Smartphone size={20} strokeWidth={2} />
              </div>
            </div>
          <h3 className="text-[16px] font-bold tracking-tight mb-1">Get the BXB Teams App</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark mb-4 max-w-[250px]">
            Install BXB Teams on your phone or laptop for quick access and a native, full-screen experience.
          </p>
          <PWAInstallButton onClick={promptInstall} />
        </div>
      )}

      <button onClick={handleSignOut} className="w-full h-[44px] rounded-xl bg-state-dangerSoft text-state-danger text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}
