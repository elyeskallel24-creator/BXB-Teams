const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add the new icons to the lucide-react import
if (!content.includes('Globe')) {
  content = content.replace(
    "ShieldAlert,",
    "ShieldAlert, Globe, History, Briefcase,"
  );
}

// 2. Update Services icon
content = content.replace(
  "{ name: 'Services', path: '/services', icon: ShieldAlert }",
  "{ name: 'Services', path: '/services', icon: Briefcase }"
);

// 3. Update Command Center icon
content = content.replace(
  "{ name: 'Command Center', path: '/command-center', icon: ShieldAlert }",
  "{ name: 'Command Center', path: '/command-center', icon: Globe }"
);

// 4. Update Audit Logs icon
content = content.replace(
  "{ name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert }",
  "{ name: 'Audit Logs', path: '/audit-logs', icon: History }"
);

fs.writeFileSync(filePath, content);
console.log('Successfully fixed duplicate icons in App.tsx. Restart your dev server.');