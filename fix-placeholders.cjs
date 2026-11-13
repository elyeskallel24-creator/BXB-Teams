const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Leads.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Broaden the industry placeholder
content = content.replace(
  'placeholder="e.g. Restaurant, Retail"',
  'placeholder="e.g. Tech, Healthcare, Sports, Agency"'
);

fs.writeFileSync(filePath, content);
console.log('Successfully broadened the industry placeholder. Restart your dev server.');