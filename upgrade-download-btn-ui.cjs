const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Login.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// The current button code
const oldButtonRegex = /\{!isInstalled && \([\s\S]*?\)\}/;

// The new premium button code
const newButton = `{!isInstalled && (
          <button
            onClick={promptInstall}
            className="mt-8 relative overflow-hidden flex items-center justify-center gap-3 text-[14px] font-medium text-white transition-all duration-300 py-3.5 px-8 rounded-full border border-white/10 bg-[#111113] hover:bg-[#1A1A1E] hover:border-[#FF6B2C]/50 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_-5px_rgba(255,107,44,0.3)] group"
          >
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B2C]/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
            
            <Download size={18} className="text-[#FF6B2C] group-hover:-translate-y-1 transition-transform duration-300" />
            <span className="tracking-wide">Download BXB Teams App</span>
          </button>
        )}`;

if (oldButtonRegex.test(content)) {
  content = content.replace(oldButtonRegex, newButton);
  fs.writeFileSync(filePath, content);
  console.log('Successfully upgraded the Download button UI to premium dark glass. Rebuild to see it.');
} else {
  console.log('Error: Could not find the download button in Login.tsx.');
}