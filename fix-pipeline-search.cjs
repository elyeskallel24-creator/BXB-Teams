const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Pipeline.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Add the important modifier (!) to pl-10 to force it to override the input-field class
content = content.replace(
  'className="input-field pl-10"',
  'className="input-field !pl-10"'
);

fs.writeFileSync(filePath, content);
console.log('Successfully forced padding on the Pipeline search input. Restart your dev server.');