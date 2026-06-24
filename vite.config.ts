import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react() as never,
    tailwindcss() as never,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'NuVio Core',
        short_name: 'NuVio',
        description: 'NuVio Core — Buchungen & Verwaltung',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#0f172a',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Nur die App-Shell (eigene Build-Assets) precachen.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Supabase-API/Auth NIEMALS cachen — verhindert veraltete Daten/Sessions.
        navigateFallbackDenylist: [/^\/auth/, /\/rest\//],
        runtimeCaching: [],
      },
    }) as never,
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
})
