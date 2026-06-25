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
              urlPattern: /\/api\/auth\//,
              handler: 'NetworkOnly',
            },
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
    ] : [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/admin/],
          runtimeCaching: [
            // Auth endpoints — never serve from cache
            {
              urlPattern: /\/api\/auth\//,
              handler: 'NetworkOnly',
            },
            // Admin API — never cache
            {
              urlPattern: /\/api\/admin\//,
              handler: 'NetworkOnly',
            },
            // Public PG listings + details — safe to serve stale
            {
              urlPattern: /\/api\/pgs/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'pgs-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 86400,
                },
              },
            },
            // Public testimonials
            {
              urlPattern: /\/api\/testimonials/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'testimonials-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 86400,
                },
              },
            },
            // All other API (user private, owner live data) — network first
            {
              urlPattern: /\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-private-cache',
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ])
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
