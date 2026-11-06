import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, FileText, User, LogOut, Shield, Moon, Sun, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Updates from './pages/Updates';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

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
    ...(profile?.role === 'admin' ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : []),
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-light dark:bg-surface-dark text-text-primaryLight dark:text-text-primaryDark">
      <aside className="hidden md:flex flex-col w-[260px] border-r border-surface-borderLight dark:border-surface-borderDark p-4 sticky top-0 h-screen">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Logo" width={32} height={32} fetchPriority="high" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-lg tracking-tight">BXB Team</span>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondaryLight dark:text-text-secondaryDark">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ease-smooth ' + (location.pathname === item.path ? 'bg-brand-primary/10 text-brand-primary font-semibold' : 'text-text-secondaryLight dark:text-text-secondaryDark hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primaryLight dark:hover:text-text-primaryDark font-medium')}>
              <item.icon size={20} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-surface-borderLight dark:border-surface-borderDark">
          <button onClick={() => import('./supabase').then(m => m.supabase.auth.signOut())} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondaryLight dark:text-text-secondaryDark hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors w-full font-medium">
            <LogOut size={20} /> Log Out
          </button>
        </div>
      </aside>

      <header className="md:hidden flex items-center justify-between p-4 sticky top-0 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md z-20 border-b border-surface-borderLight dark:border-surface-borderDark">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="Logo" width={28} height={28} fetchPriority="high" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-bold text-lg">BXB Team</span>
        </div>
        <button onClick={() => setIsDark(!isDark)} className="p-2 text-text-secondaryLight dark:text-text-secondaryDark">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="flex-1 pb-28 md:pb-0 overflow-x-hidden">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-surface-cardLight/95 dark:bg-surface-cardDark/95 backdrop-blur-lg border border-surface-borderLight dark:border-surface-borderDark flex justify-around p-2 rounded-2xl shadow-float z-50">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={'flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all duration-200 ' + (location.pathname === item.path ? 'text-brand-primary' : 'text-text-secondaryLight dark:text-text-secondaryDark hover:text-text-primaryLight dark:hover:text-text-primaryDark')}>
            <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
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
      <Layout>
        <Routes>
          <Route path="/" element={<Updates />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
