const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Login.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Download icon to lucide-react imports
content = content.replace(
  "import { Loader2, Sun, Moon, ArrowRight } from 'lucide-react';",
  "import { Loader2, Sun, Moon, ArrowRight, Download } from 'lucide-react';"
);

// 2. Import the usePWAInstall hook
content = content.replace(
  "import { useToast } from '../components/Toast';",
  "import { useToast } from '../components/Toast';\nimport { usePWAInstall } from '../hooks/usePWAInstall';"
);

// 3. Initialize the hook inside the component
content = content.replace(
  "const toast = useToast();",
  "const toast = useToast();\n  const { isInstallable, promptInstall } = usePWAInstall();"
);

// 4. Insert the Download Button just above the footer text
const footerText = `<p className="mt-8 text-[12px] text-[var(--text-muted)] font-medium">
          We will all win at the end
        </p>`;

const buttonHTML = `{isInstallable && (
          <button
            onClick={promptInstall}
            className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors py-2.5 px-5 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 hover:bg-[var(--brand)]/10 shadow-sm"
          >
            <Download size={16} />
            Download BXB Teams App
          </button>
        )}

        ${footerText}`;

content = content.replace(footerText, buttonHTML);

fs.writeFileSync(filePath, content);
console.log('Successfully added Download button to Login.tsx. Restart your dev server.');