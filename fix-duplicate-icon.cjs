const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Remove the duplicate Briefcase from the line I injected
content = content.replace(
  "ShieldAlert, Globe, History, Briefcase,",
  "ShieldAlert, Globe, History,"
);

fs.writeFileSync(filePath, content);
console.log('Successfully removed duplicate Briefcase icon. Restart your dev server.');