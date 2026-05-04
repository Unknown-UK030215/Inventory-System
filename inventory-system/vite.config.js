import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'PSU Library Inventory',
        short_name: 'PSU Inventory',
        description: 'Inventory Management System for PSU Library',
        theme_color: '#FF5F1F',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '48x48',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
            },
            {
              name: 'charts',
              test: /node_modules[\\/]recharts/,
              priority: 20,
            },
            {
              name: 'scanner',
              test: /node_modules[\\/]html5-qrcode/,
              priority: 20,
            }
          ],
        },
      },
    },
  },
})
