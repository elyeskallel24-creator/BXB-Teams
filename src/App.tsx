import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, FileText, User, LogOut } from 'lucide-react';
import Updates from './pages/Updates';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { supabase } from './supabase';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: Home, label: 'Updates' },
    { path: '/resources', icon: FileText, label: 'Resources' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-bgLight dark:bg-brand-bgDark text-brand-secondary dark:text-white">
      <aside className="hidden md:flex flex-col w-64 border-r border-brand-borderLight dark:border-brand-borderDark p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <img src="/logo.webp" alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
          <span className="font-bold text-xl tracking-tight">BXB Team</span>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ' + (location.pathname === item.path ? 'bg-brand-primary text-brand-secondary font-semibold' : 'hover:bg-brand-primary/10')}>
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors mt-auto w-full">
          <LogOut size={20} /> Log Out
        </button>
      </aside>

      <header className="md:hidden flex items-center justify-between p-4 border-b border-brand-borderLight dark:border-brand-borderDark sticky top-0 bg-brand-bgLight/90 dark:bg-brand-bgDark/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-lg">BXB Team</span>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="p-2 text-gray-500 hover:text-red-500">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 w-full bg-brand-cardLight dark:bg-brand-cardDark border-t border-brand-borderLight dark:border-brand-borderDark flex justify-around p-2 pb-safe z-10">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={'flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-colors ' + (location.pathname === item.path ? 'text-brand-primary' : 'text-gray-500 hover:text-brand-secondary dark:hover:text-white')}>
            <item.icon size={24} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-bgLight dark:bg-brand-bgDark text-brand-secondary dark:text-white">Loading...</div>;
  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Updates />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
