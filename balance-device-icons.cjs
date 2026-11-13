const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Profile.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the MonitorSmartphone import with Laptop and Smartphone
content = content.replace(
  "import { Loader2, Camera, LogOut, Save, Hash, User, Shield, MonitorSmartphone } from 'lucide-react';",
  "import { Loader2, Camera, LogOut, Save, Hash, User, Shield, Laptop, Smartphone } from 'lucide-react';"
);

// 2. Replace the icon rendering with a balanced flex container
const oldIcon = `<MonitorSmartphone size={24} />`;

const newIcon = `<div className="flex items-center gap-1.5">
              <Laptop size={22} strokeWidth={2.5} />
              <Smartphone size={22} strokeWidth={2.5} />
            </div>`;

if (content.includes(oldIcon)) {
  content = content.replace(oldIcon, newIcon);
  fs.writeFileSync(filePath, content);
  console.log('Successfully replaced with equally balanced Laptop and Smartphone icons. Rebuild to see it.');
} else {
  // Fallback: Replace the entire orange circle container
  content = content.replace(/<div className="w-12 h-12 rounded-2xl bg-\[#FF6B2C\]\/10[^>]*>[\s\S]*?<\/div>/, 
  `<div className="w-12 h-12 rounded-2xl bg-[#FF6B2C]/10 flex items-center justify-center mb-3 text-[#FF6B2C]">
              <div className="flex items-center gap-1.5">
                <Laptop size={22} strokeWidth={2.5} />
                <Smartphone size={22} strokeWidth={2.5} />
              </div>
            </div>`);
  fs.writeFileSync(filePath, content);
  console.log('Successfully updated via fallback. Rebuild to see it.');
}