import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, FileText, User, LogOut, Shield, Moon, Sun, Loader2, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import Updates from './pages/Updates';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Leaderboard from './pages/Leaderboard';
import { useAuth } from './context/AuthContext';
import { supabase } from './supabase';
import { PWAPrompts } from './components/PWAPrompts';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { profile } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDark]);

  const navItems = [
    { path: '/', icon: Home, label: 'Updates' },
    { path: '/resources', icon: FileText, label: 'Resources' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ...(profile?.role === 'admin' ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : []),
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-light dark:bg-surface-dark text-text-primaryLight dark:text-text-primaryDark">
      <aside className="hidden md:flex flex-col w-[240px] border-r border-surface-borderLight dark:border-surface-borderDark p-4 sticky top-0 h-screen">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2">
            <img src="/logo.webp" alt="Logo" width={28} height={28} fetchPriority="high" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold text-[16px] tracking-tight">BXB Team</span>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondaryLight dark:text-text-secondaryDark">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={'flex items-center gap-3 px-3 h-[40px] rounded-xl transition-all duration-200 ease-smooth text-[14px] ' + (location.pathname === item.path ? 'bg-brand-primary/10 text-brand-primary font-semibold' : 'text-text-secondaryLight dark:text-text-secondaryDark hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primaryLight dark:hover:text-text-primaryDark font-medium')}>
              <item.icon size={18} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-3 h-[40px] rounded-xl text-text-secondaryLight dark:text-text-secondaryDark hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors w-full font-medium text-[14px]">
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      <header className="md:hidden flex items-center justify-between h-[52px] px-4 sticky top-0 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md z-20 border-b border-surface-borderLight dark:border-surface-borderDark">
        <div className="flex items-center gap-2">
          <img src="/logo.webp" alt="Logo" width={24} height={24} fetchPriority="high" className="w-6 h-6 rounded-lg object-cover" />
          <span className="hidden min-[360px]:block font-bold text-[16px]">BXB Team</span>
        </div>
        <button onClick={() => setIsDark(!isDark)} className="p-2 text-text-secondaryLight dark:text-text-secondaryDark">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="flex-1 pb-[160px] md:pb-0 overflow-x-hidden">
        <div className="max-w-[720px] mx-auto md:py-8 px-4 md:px-6">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-[calc(8px+env(safe-area-inset-bottom,20px))] left-3 right-3 bg-surface-cardLight/95 dark:bg-surface-cardDark/95 backdrop-blur-lg border border-surface-borderLight dark:border-surface-borderDark flex justify-around h-[60px] rounded-2xl shadow-float z-50">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={'flex flex-col items-center justify-center gap-1 w-[64px] rounded-xl transition-all duration-200 ' + (location.pathname === item.path ? 'text-brand-primary' : 'text-text-secondaryLight dark:text-text-secondaryDark hover:text-text-primaryLight dark:hover:text-text-primaryDark')}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${location.pathname === item.path ? 'bg-brand-primary/15' : ''}`}>
              <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark text-brand-primary"><Loader2 className="animate-spin" size={32} /></div>;
  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <PWAPrompts />
      <Layout>
        <Routes>
          <Route path="/" element={<Updates />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
