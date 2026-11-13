const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Login.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Find the current download button and replace it with a premium styled version
const oldButton = `{!isInstalled && (
          <button
            onClick={promptInstall}
            className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors py-2.5 px-5 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 hover:bg-[var(--brand)]/10 shadow-sm"
          >
            <Download size={16} />
            Download BXB Teams App
          </button>
        )}`;

const newButton = `{!isInstalled && (
          <button
            onClick={promptInstall}
            className="mt-8 flex items-center justify-center gap-2.5 text-[14px] font-semibold text-[var(--brand)] hover:text-white transition-all duration-300 py-3 px-8 rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 hover:bg-[var(--brand)] shadow-[0_4px_20px_-5px_rgba(255,107,44,0.3)] hover:shadow-[0_8px_25px_-5px_rgba(255,107,44,0.5)] group"
          >
            <Download size={18} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
            Download BXB Teams App
          </button>
        )}`;

content = content.replace(oldButton, newButton);

fs.writeFileSync(filePath, content);
console.log('Successfully upgraded the aesthetic of the Download button. Rebuild to see it.');