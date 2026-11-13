const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'vite.config.ts');

const newConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globIgnores: ['**/pdf.worker*'] },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'BXB Teams',
        short_name: 'BXB Teams',
        description: 'Sales Team Management App',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
`;

fs.writeFileSync(filePath, newConfig);
console.log('Successfully updated vite.config.ts with the new PWA icons and manifest.');