/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'

// Politique de sécurité du contenu, injectée uniquement dans le build de production
// (le serveur de dev de Vite a besoin de scripts inline).
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: https://*.nasa.gov",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'declic-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
  }
}

// base relative ('./') + HashRouter : le site fonctionne sous n'importe quel
// sous-chemin GitHub Pages (https://<compte>.github.io/<depot>/) sans configuration.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    cspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'DÉCLIC — comprendre le monde en 5 minutes',
        short_name: 'Déclic',
        description: "Actualité, découvertes et jeux de culture générale. Cinq minutes par jour pour comprendre le monde.",
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#F7F5EF',
        theme_color: '#176B65',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Le code, les polices, les fiches et les banques de questions sont pré-cachés :
        // ils restent consultables hors ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Données d'actualité : réseau d'abord, cache en secours (dernière version vue).
            urlPattern: ({ url }) => url.pathname.includes('/data/') && url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'declic-data',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          {
            urlPattern: ({ url }) => /nasa\.gov$/.test(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'declic-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
