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
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (isSignUp) {
        if (!file) throw new Error("Please select a profile photo.");
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (!authData.user) throw new Error("Signup failed.");
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
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bgLight dark:bg-brand-bgDark p-4">
      <div className="max-w-md w-full bg-white dark:bg-brand-cardDark rounded-2xl shadow-xl p-8 border border-brand-borderLight dark:border-brand-borderDark">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.webp" alt="Logo" className="w-16 h-16 rounded-2xl object-cover mb-4 shadow-sm" />
          <h1 className="text-2xl font-bold text-brand-secondary dark:text-white text-center">
            {isSignUp ? 'Claim your Team ID' : 'Welcome back'}
          </h1>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-secondary dark:text-gray-300 mb-1">User ID</label>
            <input type="text" required value={userIdCode} onChange={e => setUserIdCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-brand-borderLight dark:border-brand-borderDark bg-transparent focus:ring-2 focus:ring-brand-primary outline-none text-brand-secondary dark:text-white" />
          </div>
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-secondary dark:text-gray-300 mb-1">Username</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-brand-borderLight dark:border-brand-borderDark bg-transparent focus:ring-2 focus:ring-brand-primary outline-none text-brand-secondary dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-secondary dark:text-gray-300 mb-1">Profile Photo</label>
                <input type="file" accept="image/*" required onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-brand-secondary dark:text-gray-300 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-brand-borderLight dark:border-brand-borderDark bg-transparent focus:ring-2 focus:ring-brand-primary outline-none text-brand-secondary dark:text-white" />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-brand-primary text-brand-secondary font-bold py-3 rounded-xl hover:bg-brand-accent transition-colors flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-sm text-brand-primary font-medium hover:underline">
            {isSignUp ? 'Already have an account? Log in' : 'New here? Claim your User ID'}
          </button>
        </div>
      </div>
    </div>
  );
}
