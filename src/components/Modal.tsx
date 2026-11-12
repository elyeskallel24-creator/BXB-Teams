import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ isOpen, onClose, title, subtitle, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        ((modalRef.current?.querySelector('input, textarea, select') as HTMLElement | null) ?? (focusableElements[0] as HTMLElement)).focus();
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-opacity"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-[520px] max-h-[calc(100dvh-0px)] sm:max-h-[calc(100dvh-48px)] bg-surface-elevatedLight dark:bg-surface-elevatedDark border border-surface-borderLight dark:border-surface-borderDark sm:rounded-2xl rounded-t-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] flex flex-col animate-modal-enter"
      >
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full" />
        </div>

        <div className="flex items-start justify-between px-6 py-5 border-b border-surface-borderLight dark:border-surface-borderDark shrink-0">
          <div>
            <h2 id="modal-title" className="text-[20px] font-semibold text-text-primaryLight dark:text-text-primaryDark tracking-tight">{title}</h2>
            {subtitle && <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondaryLight dark:text-text-secondaryDark hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primaryLight dark:hover:text-text-primaryDark transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-surface-borderLight dark:border-surface-borderDark bg-surface-elevatedLight dark:bg-surface-elevatedDark sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
