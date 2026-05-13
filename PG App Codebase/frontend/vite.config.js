import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'student' ? [
      VitePWA({
        registerType: 'autoUpdate',
        outDir: 'dist-student',
        manifestFilename: 'manifest.json',
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ] : [])
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    outDir: mode === 'student' ? 'dist-student' : 'dist-unified',
    target: 'esnext',
  },
  server: {
    port: mode === 'student' ? 5173 : 5174,
  },
}))
