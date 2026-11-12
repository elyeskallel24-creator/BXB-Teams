import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globIgnores: ['**/pdf.worker*'] },
      includeAssets: ['logo.webp', 'favicon.svg'],
      manifest: {
        name: 'BXB Teams',
        short_name: 'BXB Teams',
        description: 'Sales Team Management App',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        icons: [
          {
            src: 'logo.webp',
            sizes: '192x192',
            type: 'image/webp'
          },
          {
            src: 'logo.webp',
            sizes: '512x512',
            type: 'image/webp'
          }
        ]
      }
    })
  ],
})

