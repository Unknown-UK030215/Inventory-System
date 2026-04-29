import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
