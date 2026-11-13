const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'hooks', 'usePWAInstall.ts');

const content = `import { useState, useEffect } from 'react';

// Catch the event globally before React even mounts
let globalDeferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    // Dispatch a custom event to tell React the prompt is ready
    window.dispatchEvent(new Event('pwa-prompt-ready'));
  });
}

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(!!globalDeferredPrompt);

  useEffect(() => {
    const handlePromptReady = () => {
      setIsInstallable(true);
    };

    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
    };
  }, []);

  const promptInstall = async () => {
    if (!globalDeferredPrompt) {
      alert("To install the app, please click the 'Install' icon in your browser's address bar, or use your browser menu and select 'Add to Home Screen'.");
      return;
    }
    
    globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    
    globalDeferredPrompt = null;
  };

  return { isInstallable, promptInstall };
}
`;

fs.writeFileSync(filePath, content);
console.log('Successfully updated usePWAInstall.ts. Rebuild the app.');