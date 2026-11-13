const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Profile.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// We will target the exact container block we inserted previously
const oldBlock = `<div className="w-12 h-12 rounded-2xl bg-[#FF6B2C]/10 flex items-center justify-center mb-3 text-[#FF6B2C]">
              <div className="flex items-center gap-1.5">
                <Laptop size={22} strokeWidth={2.5} />
                <Smartphone size={22} strokeWidth={2.5} />
              </div>
            </div>`;

// The refined, polished block
const newBlock = `<div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B2C]/20 to-[#FF6B2C]/5 ring-1 ring-[#FF6B2C]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex items-center justify-center mb-4 text-[#FF6B2C]">
              <div className="flex items-center gap-2">
                <Laptop size={20} strokeWidth={2} />
                <Smartphone size={20} strokeWidth={2} />
              </div>
            </div>`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, content);
  console.log('Successfully polished the device icons. Rebuild to see it.');
} else {
  // Fallback just in case the string format slightly changed
  console.log('Exact block not found, attempting regex replacement...');
  const regex = /<div className="w-12 h-12 rounded-2xl bg-\[#FF6B2C\]\/10[\s\S]*?<\/div>\s*<\/div>/;
  content = content.replace(regex, newBlock);
  fs.writeFileSync(filePath, content);
  console.log('Successfully updated via fallback. Rebuild to see it.');
}