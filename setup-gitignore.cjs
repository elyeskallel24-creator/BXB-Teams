const fs = require('fs');
const path = require('path');

const gitignoreContent = `# Dependencies
node_modules/

# Production build
dist/
dist-ssr/

# Local env files
.env
.env.local
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea/
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`;

fs.writeFileSync(path.join(__dirname, '.gitignore'), gitignoreContent);
console.log('Successfully created .gitignore file!');