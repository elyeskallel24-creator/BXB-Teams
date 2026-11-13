const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Profile.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports for the new hook and component
content = content.replace(
  "import { SkeletonBox } from '../components/Skeleton';",
  "import { SkeletonBox } from '../components/Skeleton';\nimport { PWAInstallButton } from '../components/PWAInstallButton';\nimport { usePWAInstall } from '../hooks/usePWAInstall';"
);

// 2. Initialize the PWA hook inside the component
content = content.replace(
  "const { profile } = useAuth();\n  const toast = useToast();",
  "const { profile } = useAuth();\n  const toast = useToast();\n  const { isInstalled, promptInstall } = usePWAInstall();"
);

// 3. Insert the UI block right before the Sign out button
const signOutBtn = `<button onClick={handleSignOut} className="w-full h-[44px] rounded-xl bg-state-dangerSoft text-state-danger text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">`;

const installCard = `{!isInstalled && (
        <div className="card !p-6 mb-4 flex flex-col items-center text-center bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)] border border-[var(--border)]">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B2C]/10 flex items-center justify-center mb-3 text-[#FF6B2C]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
          </div>
          <h3 className="text-[16px] font-bold tracking-tight mb-1">Get the BXB Teams App</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark mb-4 max-w-[250px]">
            Install BXB Teams on your phone or laptop for quick access and a native, full-screen experience.
          </p>
          <PWAInstallButton onClick={promptInstall} />
        </div>
      )}

      ${signOutBtn}`;

if (content.includes(signOutBtn)) {
  content = content.replace(signOutBtn, installCard);
  fs.writeFileSync(filePath, content);
  console.log('Successfully added the Download App card to Profile.tsx. Rebuild to see it.');
} else {
  console.log('Error: Could not find the Sign Out button to inject the new UI.');
}