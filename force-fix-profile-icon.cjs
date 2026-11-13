const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Profile.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// 1. Ensure MonitorSmartphone is imported
if (!content.includes('MonitorSmartphone')) {
  content = content.replace(
    "import { Loader2, Camera, LogOut, Save, Hash, User, Shield } from 'lucide-react';",
    "import { Loader2, Camera, LogOut, Save, Hash, User, Shield, MonitorSmartphone } from 'lucide-react';"
  );
}

// 2. Replace the entire card to guarantee the icon is updated
const oldCardRegex = /\{!isInstalled && \([\s\S]*?<\/div>\s*\)\}/;

const newCard = `{!isInstalled && (
        <div className="card !p-6 mb-4 flex flex-col items-center text-center bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)] border border-[var(--border)]">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B2C]/10 flex items-center justify-center mb-3 text-[#FF6B2C]">
            <MonitorSmartphone size={24} />
          </div>
          <h3 className="text-[16px] font-bold tracking-tight mb-1">Get the BXB Teams App</h3>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark mb-4 max-w-[250px]">
            Install BXB Teams on your phone or laptop for quick access and a native, full-screen experience.
          </p>
          <PWAInstallButton onClick={promptInstall} />
        </div>
      )}`;

if (oldCardRegex.test(content)) {
  content = content.replace(oldCardRegex, newCard);
  fs.writeFileSync(filePath, content);
  console.log('Successfully forced the MonitorSmartphone icon update. Rebuild to see it.');
} else {
   // Fallback: Just replace whatever SVG is inside that specific div
   content = content.replace(/<div className="w-12 h-12 rounded-2xl bg-\[#FF6B2C\]\/10[^>]*>[\s\S]*?<\/div>/, 
   `<div className="w-12 h-12 rounded-2xl bg-[#FF6B2C]/10 flex items-center justify-center mb-3 text-[#FF6B2C]">
            <MonitorSmartphone size={24} />
          </div>`);
   fs.writeFileSync(filePath, content);
   console.log('Successfully updated the icon via fallback. Rebuild to see it.');
}