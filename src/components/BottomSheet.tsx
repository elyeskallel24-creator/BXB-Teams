import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function BottomSheet({ isOpen, onClose, title, footer, children }: Props) {
  const [visible, setVisible] = useState(isOpen);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const startYRef = useRef(0);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setTranslateY(0);
    } else if (visible) {
      const t = setTimeout(() => setVisible(false), 240);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!visible) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [visible]);

  useEffect(() => {
    if (!isOpen) { setKeyboardOffset(0); return; }
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const kb = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(Math.max(0, kb));
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    handler();
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!visible) return null;

  function handleBackdropClick() {
    const active = document.activeElement as HTMLElement | null;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
      active.blur();
      return;
    }
    onClose();
  }

  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY - translateY;
    setIsDragging(true);
  }
  function handleTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setTranslateY(delta);
  }
  function handleTouchEnd() {
    setIsDragging(false);
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
  }

  const slideOffset = isOpen ? translateY : 1000;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined}>
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-sm transition-all duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          transitionProperty: 'opacity',
          transitionDuration: '200ms',
        }}
        onClick={handleBackdropClick}
      />
      <div
        className="absolute left-0 right-0 mx-auto max-w-xl md:max-w-2xl bg-surface-elevatedLight dark:bg-surface-elevatedDark rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-x border-surface-borderLight dark:border-surface-borderDark flex flex-col max-h-[88dvh]"
        style={{
          transform: `translateY(${slideOffset}px)`,
          transitionProperty: 'transform',
          transitionDuration: isDragging ? '0ms' : '240ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          bottom: keyboardOffset,
        }}
      >
        <div
          className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-surface-borderLight dark:border-surface-borderDark shrink-0"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-9" />
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full mb-2" />
            {title && (
              <h2 id={titleId} className="text-[17px] font-bold truncate max-w-full px-2 tracking-tight">
                {title}
              </h2>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full text-text-secondaryLight dark:text-text-secondaryDark active:bg-black/5 dark:active:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="overflow-y-auto overscroll-contain px-5 pt-4 flex-1 min-h-0"
          style={{ paddingBottom: footer ? '1rem' : 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>

        {footer && (
          <div
            className="shrink-0 border-t border-surface-borderLight dark:border-surface-borderDark px-4 py-3 bg-surface-elevatedLight dark:bg-surface-elevatedDark"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

