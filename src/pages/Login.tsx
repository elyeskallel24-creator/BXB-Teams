import { useState } from 'react';
import { supabase } from '../supabase';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userIdCode, setUserIdCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const email = userIdCode.trim().toLowerCase() + '@bxb-team.com';
    try {
      if (password.length < 8) throw new Error('Password must be at least 8 characters.');
      if (isSignUp) {
        if (!file) throw new Error('Please select a profile photo.');
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (!authData.user) throw new Error('Signup failed.');
        const fileExt = file.name.split('.').pop();
        const filePath = authData.user.id + '-' + Math.random() + '.' + fileExt;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const { error: claimError } = await supabase.rpc('claim_user_id', {
          p_user_id_code: userIdCode.trim().toUpperCase(),
          p_username: username.trim(),
          p_avatar_url: publicUrl
        });
        if (claimError) throw claimError;
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark p-4 animate-enter">
      <div className="w-full max-w-[360px] bg-surface-cardLight dark:bg-surface-cardDark rounded-3xl shadow-float p-6 border border-surface-borderLight dark:border-surface-borderDark">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.webp" alt="Logo" width={56} height={56} fetchPriority="high" className="w-14 h-14 rounded-2xl object-cover mb-4 shadow-sm" />
          <h1 className="text-[22px] font-bold tracking-tight text-center">
            {isSignUp ? 'Claim your Team ID' : 'Welcome back'}
          </h1>
          <p className="text-text-secondaryLight dark:text-text-secondaryDark mt-1 text-[13px] text-center">
            {isSignUp ? 'Enter your assigned ID to join.' : 'Enter your ID and password to continue.'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-3">
          <div>
            <label className="block text-[13px] font-semibold mb-1 ml-1">User ID</label>
            <input type="text" required value={userIdCode} onChange={e => setUserIdCode(e.target.value)} className="input-field" />
          </div>
          
          {isSignUp && (
            <>
              <div>
                <label className="block text-[13px] font-semibold mb-1 ml-1">Username</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold mb-1 ml-1">Profile Photo</label>
                <input type="file" accept="image/*" required onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-[13px] text-text-secondaryLight dark:text-text-secondaryDark file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[13px] file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 transition-colors cursor-pointer" />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-[13px] font-semibold mb-1 ml-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-field" />
          </div>
          
          {error && (
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[13px] font-medium text-center animate-enter">
              {error}
            </div>
          )}
          
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isSignUp ? 'Create Account' : 'Log In')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-[13px] font-semibold text-brand-primary hover:text-brand-accent transition-colors">
            {isSignUp ? 'Already have an account? Log in' : 'New here? Claim your User ID'}
          </button>
        </div>
      </div>
    </div>
  );
}