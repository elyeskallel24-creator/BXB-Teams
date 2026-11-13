import { useState, useEffect } from 'react';

let globalDeferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
  });
}

export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  const promptInstall = async () => {
    if (globalDeferredPrompt) {
      globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      if (outcome === 'accepted') {
        globalDeferredPrompt = null;
      }
    } else {
      // Fallback instructions for iOS or if the prompt is suppressed
      alert("To install the BXB Teams App:\n\n- On iPhone/iPad: Tap the 'Share' icon and select 'Add to Home Screen'.\n- On Desktop Chrome/Edge: Click the install icon in the address bar or open the menu and select 'Install App'.\n- On Android: Tap the menu (three dots) and select 'Install app'.");
    }
  };

  return { isInstalled, promptInstall };
}
