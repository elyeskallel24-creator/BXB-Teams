import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import {
  Search, Command, ArrowRight, Building2, Loader2,
  LayoutDashboard, Target, Layers, ListTodo, Calendar, Wrench,
  DollarSign, FileText, BookOpen, Flag, Bell, BarChart3, Map as MapIcon,
  GraduationCap, Users, Shield, Globe, Lock, Trophy, Home, User,
} from 'lucide-react';

type Category = 'Workspace' | 'Sales' | 'Enablement' | 'Community' | 'Administration' | 'Account';

type PageItem = {
  kind: 'page';
  path: string;
  label: string;
  category: Category;
  icon: any;
  keywords?: string;
  adminOnly?: boolean;
};

type LeadHit = {
  kind: 'lead';
  id: string;
  name: string;
  industry: string | null;
};

const ALL_PAGES: Omit<PageItem, 'kind'>[] = [
  { path: '/dashboard', label: 'Home', category: 'Workspace', icon: LayoutDashboard, keywords: 'dashboard overview today' },
  { path: '/leads', label: 'Leads', category: 'Workspace', icon: Target, keywords: 'crm prospects accounts' },
  { path: '/pipeline', label: 'Pipeline', category: 'Workspace', icon: Layers, keywords: 'kanban stages board' },
  { path: '/tasks', label: 'Tasks', category: 'Workspace', icon: ListTodo, keywords: 'todo follow-up reminders' },
  { path: '/meetings', label: 'Meetings', category: 'Workspace', icon: Calendar, keywords: 'calendar schedule calls' },
  { path: '/handovers', label: 'Handovers', category: 'Sales', icon: Wrench, keywords: 'technical requests assessment' },
  { path: '/deals', label: 'Deals', category: 'Sales', icon: DollarSign, keywords: 'opportunities revenue value' },
  { path: '/proposals', label: 'Proposals', category: 'Sales', icon: FileText, keywords: 'offers quotes approval' },
  { path: '/targets', label: 'Targets', category: 'Sales', icon: Flag, keywords: 'goals quota objectives' },
  { path: '/services', label: 'Services', category: 'Enablement', icon: BookOpen, keywords: 'catalogue products what we sell' },
  { path: '/playbooks', label: 'Playbooks', category: 'Enablement', icon: MapIcon, keywords: 'scripts templates market' },
  { path: '/training', label: 'Training', category: 'Enablement', icon: GraduationCap, keywords: 'learning modules onboarding' },
  { path: '/reports', label: 'Reports', category: 'Enablement', icon: BarChart3, keywords: 'analytics metrics performance' },
  { path: '/', label: 'Updates', category: 'Community', icon: Home, keywords: 'announcements news feed' },
  { path: '/resources', label: 'Resources', category: 'Community', icon: FileText, keywords: 'documents pdf files library' },
  { path: '/leaderboard', label: 'Leaderboard', category: 'Community', icon: Trophy, keywords: 'ranking points top' },
  { path: '/teams', label: 'Teams', category: 'Administration', icon: Users, adminOnly: true, keywords: 'team management members' },
  { path: '/command-center', label: 'Command Center', category: 'Administration', icon: Globe, adminOnly: true, keywords: 'global overview operations' },
  { path: '/commercial-records', label: 'Commercial Records', category: 'Administration', icon: Lock, adminOnly: true, keywords: 'compensation confidential' },
  { path: '/audit-logs', label: 'Audit Logs', category: 'Administration', icon: Shield, adminOnly: true, keywords: 'history events trail' },
  { path: '/admin', label: 'Administration', category: 'Administration', icon: Shield, adminOnly: true, keywords: 'ids users access settings' },
  { path: '/notifications', label: 'Notifications', category: 'Account', icon: Bell, keywords: 'alerts unread' },
  { path: '/profile', label: 'Profile', category: 'Account', icon: User, keywords: 'account me settings' },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [leadHits, setLeadHits] = useState<LeadHit[]>([]);
  const [leadLoading, setLeadLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function keyHandler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function openHandler() { setOpen(true); }
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('bxb:open-command-palette', openHandler);
    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('bxb:open-command-palette', openHandler);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setLeadHits([]);
      setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setLeadHits([]);
      setLeadLoading(false);
      return;
    }
    let cancelled = false;
    setLeadLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('businesses')
        .select('id, name, industry')
        .ilike('name', `%${q}%`)
        .limit(6);
      if (cancelled) return;
      setLeadHits(((data as any[]) || []).map(b => ({
        kind: 'lead' as const,
        id: b.id,
        name: b.name,
        industry: b.industry,
      })));
      setLeadLoading(false);
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, open]);

  const filteredPages = useMemo(() => {
    const pool = ALL_PAGES.filter(i => !i.adminOnly || isAdmin);
    if (!query.trim()) return pool;
    const q = query.toLowerCase();
    return pool.filter(i =>
      i.label.toLowerCase().includes(q) ||
      (i.keywords || '').toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  }, [query, isAdmin]);

  const flat: (PageItem | LeadHit)[] = useMemo(() => {
    const pages: PageItem[] = filteredPages.map(p => ({ kind: 'page', ...p }));
    return [...leadHits, ...pages];
  }, [filteredPages, leadHits]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  function activate(item: PageItem | LeadHit) {
    if (item.kind === 'page') navigate(item.path);
    else navigate('/leads', { state: { search: item.name } });
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flat[activeIndex]) {
      e.preventDefault();
      activate(flat[activeIndex]);
    }
  }

  const groups = useMemo(() => {
    const map = new globalThis.Map<Category, { item: PageItem; idx: number }[]>();
    filteredPages.forEach((p, i) => {
      const item: PageItem = { kind: 'page', ...p };
      const idx = leadHits.length + i;
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push({ item, idx });
    });
    return Array.from(map.entries());
  }, [filteredPages, leadHits.length]);

  if (!open) return null;

  const hasResults = filteredPages.length > 0 || leadHits.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-[560px] bg-surface-elevatedLight dark:bg-surface-elevatedDark rounded-2xl border border-surface-borderLight dark:border-surface-borderDark shadow-float dark:shadow-floatDark overflow-hidden animate-enter">
        <div className="flex items-center gap-2 px-4 h-[52px] border-b border-surface-borderLight dark:border-surface-borderDark">
          <Search size={16} className="text-text-mutedLight dark:text-text-mutedDark shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, leads, actions…"
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-text-mutedLight dark:placeholder:text-text-mutedDark"
          />
          {leadLoading ? (
            <Loader2 size={14} className="animate-spin text-text-mutedLight dark:text-text-mutedDark shrink-0" />
          ) : (
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-text-mutedLight dark:text-text-mutedDark border border-surface-borderLight dark:border-surface-borderDark rounded px-1.5 h-[20px]">ESC</kbd>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto py-1">
          {!hasResults ? (
            <div className="px-4 py-8 text-center text-[13px] text-text-mutedLight dark:text-text-mutedDark">
              No results for "{query}"
            </div>
          ) : (
            <>
              {leadHits.length > 0 && (
                <div className="py-1">
                  <p className="eyebrow px-4 py-1">Leads</p>
                  {leadHits.map((hit, i) => {
                    const active = i === activeIndex;
                    return (
                      <button
                        key={`lead-${hit.id}`}
                        onClick={() => activate(hit)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={
                          'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ' +
                          (active ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-black/5 dark:hover:bg-white/5')
                        }
                      >
                        <Building2 size={16} className={active ? 'text-brand-primary shrink-0' : 'text-text-mutedLight dark:text-text-mutedDark shrink-0'} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium tracking-tight truncate">{hit.name}</p>
                          {hit.industry && <p className="text-[11px] text-text-mutedLight dark:text-text-mutedDark truncate">{hit.industry}</p>}
                        </div>
                        {active && <ArrowRight size={14} className="text-brand-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
              {groups.map(([category, entries]) => (
                <div key={category} className="py-1">
                  <p className="eyebrow px-4 py-1">{category}</p>
                  {entries.map(({ item, idx }) => {
                    const active = idx === activeIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => activate(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={
                          'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ' +
                          (active ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-black/5 dark:hover:bg-white/5')
                        }
                      >
                        <Icon size={16} className={active ? 'text-brand-primary shrink-0' : 'text-text-mutedLight dark:text-text-mutedDark shrink-0'} />
                        <span className="text-[13px] font-medium tracking-tight flex-1 truncate">{item.label}</span>
                        {active && <ArrowRight size={14} className="text-brand-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 h-[36px] border-t border-surface-borderLight dark:border-surface-borderDark text-[10px] text-text-mutedLight dark:text-text-mutedDark">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="border border-surface-borderLight dark:border-surface-borderDark rounded px-1 font-mono leading-none">↑</kbd>
              <kbd className="border border-surface-borderLight dark:border-surface-borderDark rounded px-1 font-mono leading-none">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-surface-borderLight dark:border-surface-borderDark rounded px-1 font-mono leading-none">↵</kbd>
              open
            </span>
          </div>
          <span className="flex items-center gap-1"><Command size={10} /> K</span>
        </div>
      </div>
    </div>
  );
}
