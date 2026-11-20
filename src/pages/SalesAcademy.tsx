import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SALES_ACADEMY_COURSES } from '../data/salesAcademyContent';
import type { SalesCourse } from '../data/salesAcademyContent';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Users,
  TrendingUp, GraduationCap
} from 'lucide-react';

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const cleaned = text.replace(/->/g, '\u2192');
  return cleaned.split('**').map((part, i) =>
    i % 2 === 1
      ? <strong key={`${keyPrefix}-${i}`} className="font-semibold text-[var(--text-primary)]">{part}</strong>
      : part
  );
}

function renderContent(content: string): ReactNode[] {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let k = 0;
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === '') { i++; continue; }

    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3 key={k++} className="text-[15px] md:text-[16px] font-bold text-[var(--text-primary)] mt-6 mb-2">
          {renderInline(trimmed.slice(4), `h3-${k}`)}
        </h3>
      );
      i++;
    } else if (trimmed.startsWith('## ')) {
      blocks.push(
        <h2 key={k++} className="text-[16px] md:text-[18px] font-bold tracking-tight text-[var(--text-primary)] mt-8 mb-3">
          {renderInline(trimmed.slice(3), `h2-${k}`)}
        </h2>
      );
      i++;
    } else if (trimmed.startsWith('# ')) {
      blocks.push(
        <h1 key={k++} className="text-[18px] md:text-[20px] font-bold uppercase tracking-wide text-[var(--brand)] mt-10 mb-4 pb-2 border-b border-[var(--border)]">
          {renderInline(trimmed.slice(2), `h1-${k}`)}
        </h1>
      );
      i++;
    } else if (/^[-*] /.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*] /, ''));
        i++;
      }
      blocks.push(
        <ul key={k++} className="list-disc pl-5 space-y-1.5 my-4 text-[15px] text-[var(--text-primary)]">
          {items.map((it, idx) => <li key={idx}>{renderInline(it, `ul-${k}-${idx}`)}</li>)}
        </ul>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push(
        <ol key={k++} className="list-decimal pl-5 space-y-1.5 my-4 text-[15px] text-[var(--text-primary)]">
          {items.map((it, idx) => <li key={idx}>{renderInline(it, `ol-${k}-${idx}`)}</li>)}
        </ol>
      );
    } else if (trimmed.startsWith('>')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        items.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote key={k++} className="border-l-2 border-[var(--brand)] pl-4 my-4 italic text-[15px] text-[var(--text-secondary)]">
          {items.map((it, idx) => <p key={idx}>{renderInline(it, `bq-${k}-${idx}`)}</p>)}
        </blockquote>
      );
    } else {
      const para: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t === '' || t.startsWith('#') || /^[-*] /.test(t) || /^\d+\.\s/.test(t) || t.startsWith('>')) break;
        para.push(t);
        i++;
      }
      blocks.push(
        <p key={k++} className="my-3 text-[15px] leading-relaxed text-[var(--text-primary)]">
          {renderInline(para.join(' '), `p-${k}`)}
        </p>
      );
    }
  }
  return blocks;
}

export default function SalesAcademy() {
  const { profile } = useAuth();
  const [activeCourse, setActiveCourse] = useState<SalesCourse | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    const saved = localStorage.getItem(`bxb_sales_academy_${profile.id}`);
    if (saved) setCompleted(JSON.parse(saved));
  }, [profile]);

  const toggleComplete = (id: string) => {
    const next = completed.includes(id) ? completed.filter(c => c !== id) : [...completed, id];
    setCompleted(next);
    if (profile?.id) localStorage.setItem(`bxb_sales_academy_${profile.id}`, JSON.stringify(next));
  };

  const doneCount = completed.length;
  const totalCount = SALES_ACADEMY_COURSES.length;
  const overallPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleNext = () => {
    if (!activeCourse) return;
    const idx = SALES_ACADEMY_COURSES.findIndex(c => c.id === activeCourse.id);
    if (idx < SALES_ACADEMY_COURSES.length - 1) setActiveCourse(SALES_ACADEMY_COURSES[idx + 1]);
  };

  const handlePrev = () => {
    if (!activeCourse) return;
    const idx = SALES_ACADEMY_COURSES.findIndex(c => c.id === activeCourse.id);
    if (idx > 0) setActiveCourse(SALES_ACADEMY_COURSES[idx - 1]);
  };

  if (activeCourse) {
    const isDone = completed.includes(activeCourse.id);
    const idx = SALES_ACADEMY_COURSES.findIndex(c => c.id === activeCourse.id);

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto animate-enter min-h-[80dvh] flex flex-col">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 w-fit">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="flex-1">
          <p className="eyebrow text-[var(--brand)] mb-2">BXB Sales Academy / Course {idx + 1}</p>
          <h1 className="text-[26px] md:text-[32px] font-bold tracking-tight mb-3">{activeCourse.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-2.5 py-1 rounded-full border border-[var(--border)]">
              <Users size={12} /> {activeCourse.format}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider bg-[var(--brand-soft)] text-[var(--brand)] px-2.5 py-1 rounded-full border border-[var(--brand)]/30">
              <TrendingUp size={12} /> {activeCourse.level}
            </span>
          </div>

          <div className="max-w-none text-[15px] leading-relaxed text-[var(--text-primary)]">
            {renderContent(activeCourse.content)}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          <button onClick={handlePrev} disabled={idx === 0} className="btn-secondary flex-1 min-w-[120px]">
            <ArrowLeft size={16} /> Previous
          </button>

          <button onClick={() => toggleComplete(activeCourse.id)} className={`btn-primary flex-1 min-w-[140px] ${isDone ? '!bg-state-successSoft !text-state-success' : ''}`}>
            {isDone ? <><CheckCircle2 size={16} /> Completed</> : 'Mark as Complete'}
          </button>

          <button onClick={handleNext} disabled={idx === SALES_ACADEMY_COURSES.length - 1} className="btn-secondary flex-1 min-w-[120px]">
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-enter">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 w-fit">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
          <h1 className="page-title">BXB Sales Academy</h1>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Master the art of selling. Learn the frameworks, scripts, and psychology used by top performers.
        </p>
      </div>

      <div className="card !p-4 mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Your progress</p>
          <span className="text-[12px] font-mono font-bold">{doneCount}/{totalCount} - {overallPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div className="h-full bg-[var(--brand)] transition-all" style={{ width: overallPct + '%' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SALES_ACADEMY_COURSES.map(course => {
          const isDone = completed.includes(course.id);
          return (
            <button
              key={course.id}
              onClick={() => setActiveCourse(course)}
              className="card !p-5 text-left flex flex-col h-full hover:border-[var(--brand)]/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                    {course.format}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-[var(--brand-soft)] text-[var(--brand)] px-2 py-0.5 rounded-full border border-[var(--brand)]/30">
                    {course.level}
                  </span>
                </div>
                {isDone && <CheckCircle2 size={18} className="text-state-success shrink-0" />}
              </div>
              <h3 className="text-[16px] font-bold tracking-tight mb-2">{course.title}</h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4 flex-1">
                {course.description}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] mt-auto">
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)]">
                  Open <ArrowRight size={14} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}