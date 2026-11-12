const fs = require('fs');
const path = 'src/pages/Leads.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

let foundIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('className={\\peer')) {
    if (foundIdx !== -1) {
      console.error('Error: found multiple lines with className={\\peer. Aborting.');
      process.exit(1);
    }
    foundIdx = i;
  }
}

if (foundIdx === -1) {
  console.error('Error: could not find line with className={\\peer. Aborting.');
  process.exit(1);
}

const indentMatch = lines[foundIdx].match(/^\s*/);
const indent = indentMatch ? indentMatch[0] : '';

lines[foundIdx] = `${indent}className={['input-field !pl-10 peer', nameError ? '!border-state-danger ring-[3px] ring-state-danger/20' : ''].join(' ')}`;

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log(`\n✅ Fixed line ${foundIdx + 1}:`);
console.log(lines[foundIdx]);
