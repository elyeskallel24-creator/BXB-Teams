const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Remove the unused ShieldAlert from the import statement
content = content.replace(
  'Target, ShieldAlert, Globe, History,',
  'Target, Globe, History,'
);

// In case ShieldAlert is on a different position on line 6
content = content.replace(
  'BarChart3, BookOpen, GraduationCap, Target, ShieldAlert, Globe, History,',
  'BarChart3, BookOpen, GraduationCap, Target, Globe, History,'
);

fs.writeFileSync(filePath, content);
console.log('Successfully removed unused ShieldAlert import. Try building again.');