const fs = require('fs');
const path = require('path');

const hookPath = path.join(__dirname, 'src', 'hooks', 'usePWAInstall.ts');
const loginPath = path.join(__dirname, 'src', 'pages', 'Login.tsx');

// 1. Update the hook
const hookContent = `import { useState, useEffect } from 'react';

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
      alert("To install the BXB Teams App:\\n\\n- On iPhone/iPad: Tap the 'Share' icon and select 'Add to Home Screen'.\\n- On Desktop Chrome/Edge: Click the install icon in the address bar or open the menu and select 'Install App'.\\n- On Android: Tap the menu (three dots) and select 'Install app'.");
    }
  };

  return { isInstalled, promptInstall };
}
`;
fs.writeFileSync(hookPath, hookContent);

// 2. Update Login.tsx to ALWAYS show the button (unless already installed)
let loginContent = fs.readFileSync(loginPath, 'utf8');

// Fix the imports just in case
loginContent = loginContent.replace(
  "const { isInstallable, promptInstall } = usePWAInstall();",
  "const { isInstalled, promptInstall } = usePWAInstall();"
);

// Replace the conditional button with an always-visible one
const oldButtonRegex = /\{isInstallable && \([\s\S]*?\)\}/;
const newButton = `{!isInstalled && (
          <button
            onClick={promptInstall}
            className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors py-2.5 px-5 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 hover:bg-[var(--brand)]/10 shadow-sm"
          >
            <Download size={16} />
            Download BXB Teams App
          </button>
        )}`;

if (oldButtonRegex.test(loginContent)) {
  loginContent = loginContent.replace(oldButtonRegex, newButton);
} else {
  // If the button wasn't inserted correctly the first time due to spacing issues, insert it manually
  loginContent = loginContent.replace(
    '<p className="mt-8 text-[12px] text-[var(--text-muted)] font-medium">',
    `${newButton}\n\n        <p className="mt-8 text-[12px] text-[var(--text-muted)] font-medium">`
  );
}

fs.writeFileSync(loginPath, loginContent);

console.log('Successfully made the Download button always visible with fallback instructions.');