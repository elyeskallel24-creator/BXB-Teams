import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: number;
  kind: ToastKind;
  text: string;
};

type ToastApi = {
  success: (text: string, duration?: number) => void;
  error: (text: string, duration?: number) => void;
  warning: (text: string, duration?: number) => void;
  info: (text: string, duration?: number) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const TONE = {
  success: 'text-state-success bg-state-successSoft border-state-success/30',
  error: 'text-state-danger bg-state-dangerSoft border-state-danger/30',
  warning: 'text-state-warning bg-state-warningSoft border-state-warning/30',
  info: 'text-state-info bg-state-infoSoft border-state-info/30',
} as const;

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, text: string, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, kind, text }].slice(-MAX_VISIBLE));
    if (duration > 0) {
      window.setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const api: ToastApi = {
    success: (t, d) => push('success', t, d),
    error: (t, d) => push('error', t, d ?? 6000),
    warning: (t, d) => push('warning', t, d ?? 5000),
    info: (t, d) => push('info', t, d),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[95] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-[400px] pointer-events-none bottom-[calc(88px+env(safe-area-inset-bottom,20px))] md:bottom-6"
        aria-live="polite"
      >
        {toasts.map(t => {
          const Icon = ICON[t.kind];
          const role = t.kind === 'error' ? 'alert' : 'status';
          return (
            <div
              key={t.id}
              role={role}
              className={
                'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-float dark:shadow-floatDark animate-enter ' +
                TONE[t.kind]
              }
            >
              <Icon size={16} className="shrink-0 mt-0.5" />
              <p className="flex-1 text-[13px] font-medium leading-snug">{t.text}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 -mr-1 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
