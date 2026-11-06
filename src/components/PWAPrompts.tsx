import { useState, useEffect } from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAPrompts() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwa-dismissed')) {
        setTimeout(() => setShowInstall(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowInstall(false);
    setDismissed(true);
    localStorage.setItem('pwa-dismissed', 'true');
  }

  return (
    <>
      <AnimatePresence>
        {isOffline && (
          <motion.div initial={{y: -50, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: -50, opacity: 0}} className="fixed top-0 left-0 right-0 z-[150] bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-[13px] font-semibold shadow-md">
            <WifiOff size={16} /> You are offline. Showing cached data.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstall && !dismissed && (
          <motion.div initial={{y: 100, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 100, opacity: 0}} className="fixed bottom-[90px] left-4 right-4 z-[90] bg-surface-cardLight dark:bg-surface-cardDark border border-surface-borderLight dark:border-surface-borderDark rounded-2xl p-3 shadow-float flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                <Download size={20} />
              </div>
              <div>
                <p className="font-bold text-[14px] leading-tight">Install BXB Team</p>
                <p className="text-[12px] text-text-secondaryLight dark:text-text-secondaryDark">Add to home screen</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleDismiss} className="p-2 text-text-secondaryLight dark:text-text-secondaryDark hover:text-red-500 transition">
                <X size={18} />
              </button>
              <button onClick={handleInstall} className="bg-brand-primary text-black px-3 py-1.5 rounded-lg text-[13px] font-bold active:scale-95 transition">
                Install
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
