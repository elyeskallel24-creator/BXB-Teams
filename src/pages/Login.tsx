import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, Sun, Moon, ArrowRight } from 'lucide-react';
import { useToast } from '../components/Toast';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallButton } from '../components/PWAInstallButton';

export default function Login() {
  const toast = useToast();
  const { isInstalled, promptInstall } = usePWAInstall();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'claim'>('login');

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('bxb-theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  // Force clear inputs on mount to defeat browser auto-fill
  useEffect(() => {
    setUserId('');
    setPassword('');
    setUsername('');
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('bxb-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !password) return;
    setLoading(true);

    const email = `${userId.toLowerCase()}@bxb-team.com`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error('Invalid User ID or Password');
      setLoading(false);
    } else {
      toast.success('Welcome back');
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !password || !username) return;
    setLoading(true);

    const email = `${userId.toLowerCase()}@bxb-team.com`;

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) {
      toast.error(authError?.message || 'Could not create account');
      setLoading(false);
      return;
    }

    let avatarUrl = null;
    if (avatar) {
      const ext = avatar.name.split('.').pop();
      const path = `${authData.user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatar, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }
    }

    const { error: claimError } = await supabase.rpc('claim_user_id', {
      p_user_id_code: userId.toUpperCase(),
      p_username: username,
      p_avatar_url: avatarUrl
    });

    if (claimError) {
      toast.error(claimError.message);
      setLoading(false);
    } else {
      toast.success('Account claimed successfully');
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg-base)] relative overflow-hidden">

      {/* Subtle background gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: theme === 'dark'
          ? 'radial-gradient(circle at 50% 0%, rgba(255,107,44,0.08) 0%, transparent 60%)'
          : 'radial-gradient(circle at 50% 0%, rgba(255,107,44,0.05) 0%, transparent 60%)'
      }} />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)] backdrop-blur-md"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto animate-enter relative z-10">

        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5 group">
            {/* Logo Glow */}
            <div className="absolute inset-0 bg-[var(--brand)] blur-2xl opacity-50 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />

            {/* Logo Container */}
            <div className="w-20 h-20 flex items-center justify-center relative z-10">
              <img
                src="/logo.webp"
                alt="BXB Logo"
                className="w-full h-full object-contain drop-shadow-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span style="color:var(--brand);font-weight:bold;font-size:24px;">BXB</span>';
                }}
              />
            </div>
          </div>

          <h1 className="text-[26px] font-bold tracking-tight text-[var(--text-primary)]">BXB Teams</h1>
          <p className="text-[13px] font-medium text-[var(--text-secondary)] mt-1.5 text-center leading-tight italic opacity-80">
            On my stallion i will ride with the 4 horsemen
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full card !p-7 md:!p-8 backdrop-blur-xl bg-[var(--bg-surface)]/95 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-[20px] font-bold tracking-tight mb-1">
              {mode === 'login' ? 'Welcome back' : 'Claim your Team ID'}
            </h2>
            <p className="text-[13px] text-[var(--text-secondary)]">
              {mode === 'login'
                ? 'Sign in to continue to your workspace.'
                : 'Enter your assigned ID to join the network.'}
            </p>
          </div>

          {/* Auto-complete completely disabled on form and inputs */}
          <form onSubmit={mode === 'login' ? handleLogin : handleClaim} className="space-y-4" autoComplete="off">

            <div>
              <label className="eyebrow block mb-1.5">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value.toUpperCase())}
                className="input-field font-mono uppercase !bg-[var(--bg-base)]"
                autoComplete="off"
                name="user_id_no_autofill"
                placeholder=""
                required
              />
            </div>

            {mode === 'claim' && (
              <>
                <div>
                  <label className="eyebrow block mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="input-field !bg-[var(--bg-base)]"
                    autoComplete="off"
                    name="username_no_autofill"
                    placeholder=""
                    required
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1.5">Profile photo (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setAvatar(e.target.files?.[0] || null)}
                    className="input-field !bg-[var(--bg-base)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--brand-soft)] file:text-[var(--brand)] file:font-semibold file:px-3 file:py-1.5 file:text-[12px]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="eyebrow block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field !bg-[var(--bg-base)]"
                autoComplete="new-password"
                name="password_no_autofill"
                placeholder=""
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 !h-[46px] text-[15px] shadow-lg shadow-brand-primary/20">
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  {mode === 'login' ? 'Log In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'claim' : 'login')}
              className="text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors py-1"
            >
              {mode === 'login' ? "New here? Claim your User ID" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {!isInstalled && <PWAInstallButton onClick={promptInstall} />}

        <p className="mt-8 text-[12px] text-[var(--text-muted)] font-medium">
          We will all win at the end
        </p>
      </div>
    </div>
  );
}
