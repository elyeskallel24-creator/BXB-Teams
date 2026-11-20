import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ACADEMY_CONTENT } from '../data/academyContent';
import type { Chapter } from '../data/academyContent';
import { Search, ChevronRight, CheckCircle2, BookOpen, GraduationCap, ArrowLeft, ArrowRight, Book, Sparkles } from 'lucide-react';

export default function Academy() {
  const { profile } = useAuth();
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [search, setSearch] = useState('');
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    const saved = localStorage.getItem(`bxb_academy_${profile.id}`);
    if (saved) setCompleted(JSON.parse(saved));
  }, [profile]);

  const toggleComplete = (id: string) => {
    const next = completed.includes(id) ? completed.filter(c => c !== id) : [...completed, id];
    setCompleted(next);
    if (profile?.id) localStorage.setItem(`bxb_academy_${profile.id}`, JSON.stringify(next));
  };

  const availableChapters = useMemo(() => {
    return ACADEMY_CONTENT.filter(c => {
      if (c.roles.includes('admin') && profile?.role !== 'admin') return false;
      if (search) {
        const q = search.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q);
        }
      return true;
    });
  }, [profile, search]);

  const levels = [
    { num: 1, title: 'Start Here', desc: 'Basic app use, login, dashboard, leads, activities and tasks.', icon: Book },
    { num: 2, title: 'Learn Your Job', desc: 'Sales pipeline, qualification, meetings, technical handovers, proposals and services.', icon: BookOpen },
    { num: 3, title: 'Advanced Operations', desc: 'Team leaders, administrators, reporting and network management.', icon: GraduationCap },
  ];

  const handleNext = () => {
    if (!activeChapter) return;
    const idx = availableChapters.findIndex(c => c.id === activeChapter.id);
    if (idx < availableChapters.length - 1) setActiveChapter(availableChapters[idx + 1]);
  };

  const handlePrev = () => {
    if (!activeChapter) return;
    const idx = availableChapters.findIndex(c => c.id === activeChapter.id);
    if (idx > 0) setActiveChapter(availableChapters[idx - 1]);
  };

  if (activeChapter) {
    const isDone = completed.includes(activeChapter.id);
    const idx = availableChapters.findIndex(c => c.id === activeChapter.id);

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter min-h-[80dvh] flex flex-col">
        <button onClick={() => setActiveChapter(null)} className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 w-fit">
          <ArrowLeft size={16} /> Back to Academy
        </button>

        <div className="flex-1">
          <p className="eyebrow text-[var(--brand)] mb-2">Level {activeChapter.level} • Chapter {idx + 1}</p>
          <h1 className="text-[26px] md:text-[32px] font-bold tracking-tight mb-6">{activeChapter.title}</h1>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-[15px] leading-relaxed text-[var(--text-primary)] space-y-4 whitespace-pre-wrap">
            {activeChapter.content.split('**').map((part, index) => index % 2 === 1 ? <strong key={index}>{part}</strong> : part)}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          <button onClick={handlePrev} disabled={idx === 0} className="btn-secondary flex-1 min-w-[120px]">
            <ArrowLeft size={16} /> Previous
          </button>

          <button onClick={() => toggleComplete(activeChapter.id)} className={`btn-primary flex-1 min-w-[140px] ${isDone ? '!bg-state-successSoft !text-state-success' : ''}`}>
            {isDone ? <><CheckCircle2 size={16} /> Completed</> : 'Mark as Complete'}
          </button>

          <button onClick={handleNext} disabled={idx === availableChapters.length - 1} className="btn-secondary flex-1 min-w-[120px]">
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const level1Chapters = availableChapters.filter(c => c.level === 1);
  const level1Done = level1Chapters.filter(c => completed.includes(c.id)).length;
  const isBrandNew = level1Done === 0;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-enter">
      <div className="mb-6">
        <h1 className="page-title">BXB Academy</h1>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Learn how to use BXB and succeed in your role.
        </p>
      </div>

      {isBrandNew && !search && (
        <div className="card !p-5 md:!p-6 mb-6 border-brand-primary/30 bg-gradient-to-br from-[var(--brand-soft)] to-transparent">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand)] text-black flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-[var(--brand)] mb-1">Welcome to BXB</p>
              <h2 className="text-[18px] md:text-[20px] font-bold tracking-tight leading-tight mb-1">
                New here? Start your journey.
              </h2>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Complete Level 1 to understand the app, add your first lead, and record your first activity.
              </p>
            </div>
            <button
              onClick={() => {
                const ch1 = availableChapters.find(c => c.id === 'ch-1');
                if (ch1) setActiveChapter(ch1);
              }}
              className="btn-primary shrink-0 w-full md:w-auto"
            >
              Start Chapter 1 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
        <input
          type="text"
          placeholder="Search the guide..."
          className="input-field !pl-11"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {search ? (
        <div className="space-y-2">
          <p className="eyebrow mb-2">Search Results ({availableChapters.length})</p>
          {availableChapters.map(c => (
            <button key={c.id} onClick={() => setActiveChapter(c)} className="card !p-3 w-full text-left flex items-center justify-between hover:border-[var(--brand)]/50 transition-colors">
              <span className="text-[14px] font-semibold">{c.title}</span>
              <ChevronRight size={16} className="text-[var(--text-muted)]" />
            </button>
          ))}
          {availableChapters.length === 0 && <p className="text-[13px] text-[var(--text-muted)] text-center py-8">No chapters found.</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {levels.map(lvl => {
            if (lvl.num === 3 && profile?.role !== 'admin') return null;
            const chapters = availableChapters.filter(c => c.level === lvl.num);
            const doneCount = chapters.filter(c => completed.includes(c.id)).length;
            const pct = chapters.length > 0 ? Math.round((doneCount / chapters.length) * 100) : 0;

            return (
              <div key={lvl.num} className="card !p-0 overflow-hidden">
                <div className="p-4 md:p-5 bg-[var(--bg-elevated)] border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center shrink-0">
                      <lvl.icon size={20} />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-bold tracking-tight">Level {lvl.num} — {lvl.title}</h2>
                      <p className="text-[12px] text-[var(--text-secondary)]">{lvl.desc}</p>
                    </div>
                  </div>
                  {chapters.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0 md:w-32">
                      <div className="flex-1 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div className="h-full bg-[var(--brand)] transition-all" style={{ width: pct + '%' }} />
                      </div>
                      <span className="text-[11px] font-mono tabular-nums font-bold">{pct}%</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  {chapters.map(c => {
                    const isDone = completed.includes(c.id);
                    return (
                      <button key={c.id} onClick={() => setActiveChapter(c)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left">
                        {isDone ? <CheckCircle2 size={18} className="text-state-success shrink-0" /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-[var(--border-strong)] shrink-0" />}
                        <span className={`text-[14px] flex-1 ${isDone ? 'text-[var(--text-muted)]' : 'font-medium'}`}>{c.title}</span>
                        <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}