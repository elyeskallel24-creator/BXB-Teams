const fs = require('fs');

// --- 1. Fix BottomSheet.tsx ---
const bsPath = 'src/components/BottomSheet.tsx';
let bs = fs.readFileSync(bsPath, 'utf8');

// Add createPortal import
if (!bs.includes("import { createPortal }")) {
  bs = bs.replace("import { useEffect", "import { createPortal } from 'react-dom';\nimport { useEffect");
}

// Wrap the return statement in createPortal
const returnStart = bs.indexOf('  return (');
if (returnStart === -1) { console.error('Could not find return in BottomSheet'); process.exit(1); }
bs = bs.substring(0, returnStart) + '  return createPortal(' + bs.substring(returnStart + '  return ('.length);
const returnEnd = bs.lastIndexOf(');');
if (returnEnd === -1) { console.error('Could not find closing parenthesis in BottomSheet'); process.exit(1); }
bs = bs.substring(0, returnEnd) + ', document.body);' + bs.substring(returnEnd + 2);

// Update outer wrapper for desktop centering
bs = bs.replace(
  '<div className="fixed inset-0 z-[70]" role="dialog"',
  '<div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:p-6" role="dialog"'
);

// Update panel classes for desktop modal style
bs = bs.replace(
  'className="absolute left-0 right-0 mx-auto max-w-xl md:max-w-2xl bg-surface-elevatedLight dark:bg-surface-elevatedDark rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-x border-surface-borderLight dark:border-surface-borderDark flex flex-col max-h-[88dvh]"',
  'className="relative w-full md:max-w-[560px] bg-surface-elevatedLight dark:bg-surface-elevatedDark rounded-t-[2rem] md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:shadow-[0_10px_40px_rgba(0,0,0,0.5)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] dark:md:shadow-[0_10px_40px_rgba(0,0,0,0.6)] border-t border-x md:border border-surface-borderLight dark:border-surface-borderDark flex flex-col max-h-[88dvh]"'
);

// Hide drag handle on desktop
bs = bs.replace(
  '<div className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full mb-2" />',
  '<div className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full mb-2 md:hidden" />'
);

fs.writeFileSync(bsPath, bs, 'utf8');
console.log('✅ BottomSheet.tsx fixed with createPortal and desktop centering.');

// --- 2. Fix Leads.tsx ---
const leadsPath = 'src/pages/Leads.tsx';
let leads = fs.readFileSync(leadsPath, 'utf8');

// Make tabs sticky at the top of the scrollable body
leads = leads.replace(
  '<div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 pb-3 mb-4 border-b border-surface-borderLight dark:border-surface-borderDark">',
  '<div className="sticky -top-4 z-10 bg-surface-elevatedLight dark:bg-surface-elevatedDark flex gap-1.5 overflow-x-auto -mx-5 px-5 pt-4 pb-3 mb-4 border-b border-surface-borderLight dark:border-surface-borderDark">'
);

// Center search icon vertically and force input padding
leads = leads.replace(
  /<Search className="([^"]*)" size=\{18\} \/>/,
  '<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark" size={18} />'
);
leads = leads.replace(
  /className="input-field pl-10"/,
  'className="input-field !pl-11"'
);

fs.writeFileSync(leadsPath, leads, 'utf8');
console.log('✅ Leads.tsx fixed with sticky tabs and search icon alignment.');
