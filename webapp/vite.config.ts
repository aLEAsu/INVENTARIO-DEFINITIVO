/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  // GitHub Pages sirve este proyecto desde /INVENTARIO-DEFINITIVO/ (pagina
  // de proyecto, no de usuario). En dev/preview local se mantiene "/".
  base: command === 'serve' ? '/' : '/INVENTARIO-DEFINITIVO/',
  server: { port: 5173, strictPort: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'UNOP TI Hub',
        short_name: 'TI Hub',
        description: 'Gestion de Activos, Talento, Operacion e Incidentes TI - UNOP',
        start_url: '.',
        display: 'standalone',
        background_color: '#f5f8fa',
        theme_color: '#0b3b60',
        lang: 'es',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
}))
