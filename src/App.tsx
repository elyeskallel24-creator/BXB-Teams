import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Home, Users, LayoutDashboard, CheckSquare, Menu, Bell,
  Briefcase, Calendar, Wrench, FileText, DollarSign, Settings,
  BarChart3, BookOpen, GraduationCap, Target, Globe, History,
  TrendingUp, X, ChevronRight, Layers, Loader2, User, LogOut,
  Sun, Moon
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabase } from './supabase';
import { CommandPalette } from './components/CommandPalette';
import { QuickAction } from './components/QuickAction';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/Leads'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Meetings = lazy(() => import('./pages/Meetings'));
const TechnicalHandovers = lazy(() => import('./pages/TechnicalHandovers'));
const Deals = lazy(() => import('./pages/Deals'));
const Proposals = lazy(() => import('./pages/Proposals'));
const Services = lazy(() => import('./pages/ServiceCatalogue'));
const Targets = lazy(() => import('./pages/Targets'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Reports = lazy(() => import('./pages/Reports'));
const Playbooks = lazy(() => import('./pages/Playbooks'));
const Training = lazy(() => import('./pages/Training'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const GlobalCommandCenter = lazy(() => import('./pages/GlobalCommandCenter'));
const CommercialRecords = lazy(() => import('./pages/CommercialRecords'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Profile = lazy(() => import('./pages/Profile'));
const Updates = lazy(() => import('./pages/Updates'));
const Resources = lazy(() => import('./pages/Resources'));
const Academy = lazy(() => import('./pages/Academy'));
const SalesAcademy = lazy(() => import('./pages/SalesAcademy'));
const Help = lazy(() => import('./pages/Help'));
const Login = lazy(() => import('./pages/Login'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60dvh]">
      <Loader2 className="animate-spin text-[var(--brand)]" size={24} />
    </div>
  );
}

const NAV_GROUPS = [
  {
    label: 'Primary',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Leads', path: '/leads', icon: Users },
      { name: 'Pipeline', path: '/pipeline', icon: LayoutDashboard },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    ]
  },
  {
    label: 'Sales',
    items: [
      { name: 'Meetings', path: '/meetings', icon: Calendar },
      { name: 'Handovers', path: '/technical-handovers', icon: Wrench },
      { name: 'Deals', path: '/deals', icon: Briefcase },
      { name: 'Proposals', path: '/proposals', icon: FileText },
      { name: 'Services', path: '/services', icon: Briefcase },
      { name: 'Targets', path: '/targets', icon: Target },
    ]
  },
  {
    label: 'Workspace',
    items: [
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Reports', path: '/reports', icon: BarChart3 },
      { name: 'Playbooks', path: '/playbooks', icon: BookOpen },
      { name: 'Training', path: '/training', icon: GraduationCap },
      { name: 'Resources', path: '/resources', icon: Layers },
      { name: 'Updates', path: '/updates', icon: Bell },
      { name: 'BXB Academy', path: '/academy', icon: BookOpen },
      { name: 'BXB Sales Academy', path: '/sales-academy', icon: GraduationCap },
      { name: 'Leaderboard', path: '/leaderboard', icon: TrendingUp },
    ]
  },
  {
    label: 'Team Management',
    items: [
      { name: 'Teams', path: '/teams', icon: Users },
      { name: 'Command Center', path: '/command-center', icon: Globe },
      { name: 'Commercial Records', path: '/commercial-records', icon: DollarSign },
      { name: 'Audit Logs', path: '/audit-logs', icon: History },
      { name: 'Administration', path: '/admin', icon: Settings },
    ]
  },
  {
    label: 'Account',
    items: [
      { name: 'Profile', path: '/profile', icon: User },
    ]
  }
];

function Shell() {
  const { profile, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('bxb-theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

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

  useEffect(() => { setShowMore(false); }, [location.pathname]);

  useEffect(() => {
    if (!profile) return;
    async function fetchUnread() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile?.id || '')
        .eq('is_read', false);
      if (count !== null) setUnreadCount(count);
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  if (!session) return <Suspense fallback={<PageLoader />}><Login /></Suspense>;

  const isAdmin = profile?.role === 'admin';

  const filteredGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (['/admin', '/command-center', '/commercial-records', '/audit-logs'].includes(item.path)) {
        return isAdmin;
      }
      return true;
    })
  })).filter(g => g.items.length > 0);

  return (
    <div className="min-h-dvh flex bg-[var(--bg-base)] text-[var(--text-primary)]">

      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-[var(--border)] bg-[var(--bg-surface)] z-50">
        <div className="h-14 flex items-center px-6 border-b border-[var(--border)]">
          <span className="font-bold tracking-tight text-[15px]">BXB TEAMS</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
          {filteredGroups.map(group => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                        isActive ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                      }`
                    }
                  >
                    <item.icon size={16} className="shrink-0" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
          <Link to="/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors flex-1 min-w-0">
            <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username}`} alt="" className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{profile?.username}</p>
              <p className="text-[11px] text-[var(--text-muted)] capitalize">{profile?.role}</p>
            </div>
          </Link>
          <button onClick={toggleTheme} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--bg-subtle)] transition-colors" title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={handleLogout} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-state-danger hover:bg-state-dangerSoft transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:pl-64 min-w-0">

        <header className="md:hidden sticky top-0 z-40 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 h-14 flex items-center justify-between pt-[env(safe-area-inset-top)]">
          <span className="font-bold tracking-tight text-[15px]">BXB TEAMS</span>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 -mr-1 text-[var(--text-secondary)] transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link to="/notifications" className="relative p-2 -mr-2 text-[var(--text-secondary)]">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1 w-2.5 h-2.5 bg-state-danger rounded-full border-2 border-[var(--bg-surface)]" />
              )}
            </Link>
            <Link to="/profile">
              <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username}`} alt="" className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]" />
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0 relative">
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/technical-handovers" element={<TechnicalHandovers />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/proposals" element={<Proposals />} />
                <Route path="/services" element={<Services />} />
                <Route path="/targets" element={<Targets />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/playbooks" element={<Playbooks />} />
                <Route path="/training" element={<Training />} />
                <Route path="/teams" element={<TeamManagement />} />
                <Route path="/command-center" element={isAdmin ? <GlobalCommandCenter /> : <Navigate to="/dashboard" />} />
                <Route path="/commercial-records" element={isAdmin ? <CommercialRecords /> : <Navigate to="/dashboard" />} />
                <Route path="/audit-logs" element={isAdmin ? <AuditLogs /> : <Navigate to="/dashboard" />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/dashboard" />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/updates" element={<Updates />} />
                <Route path="/resources" element={<Resources />} />
                                <Route path="/sales-academy" element={<SalesAcademy />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                <Route path="/help" element={<Help />} />
        </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16 px-2">
            {[
              { name: 'Home', path: '/dashboard', icon: Home },
              { name: 'Leads', path: '/leads', icon: Users },
              { name: 'Pipeline', path: '/pipeline', icon: LayoutDashboard },
              { name: 'Tasks', path: '/tasks', icon: CheckSquare },
            ].map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${active ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}>
                  <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                  <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
                </Link>
              );
            })}
            <button onClick={() => setShowMore(true)} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${showMore ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}>
              <Menu size={22} strokeWidth={2} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </nav>

        {showMore && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-enter" onClick={() => setShowMore(false)} />
            <div className="relative bg-[var(--bg-surface)] w-full rounded-t-3xl max-h-[85dvh] flex flex-col animate-enter pb-[env(safe-area-inset-bottom)] border-t border-[var(--border)]">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
                <p className="text-[15px] font-bold">All Pages</p>
                <button onClick={() => setShowMore(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {filteredGroups.map(group => (
                  <div key={group.label}>
                    <p className="eyebrow mb-2">{group.label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map(item => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setShowMore(false)}
                          className={`flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] transition-colors ${location.pathname === item.path ? 'bg-[var(--brand-soft)] border-[var(--brand)]/30 text-[var(--brand)]' : 'bg-[var(--bg-elevated)]'}`}
                        >
                          <item.icon size={16} className="shrink-0" />
                          <span className="text-[13px] font-semibold truncate">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pt-2 space-y-2">
                  <Link to="/profile" onClick={() => setShowMore(false)} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username}`} alt="" className="w-8 h-8 rounded-full" />
                      <span className="text-[13px] font-semibold">{profile?.username}</span>
                    </div>
                    <ChevronRight size={16} className="text-[var(--text-muted)]" />
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-state-dangerSoft text-state-danger text-[13px] font-semibold">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <CommandPalette />
      <QuickAction />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}



