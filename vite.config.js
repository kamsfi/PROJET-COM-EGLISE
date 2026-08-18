import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate' : la nouvelle version se charge en arrière-plan et
      // remplace l'ancienne au prochain chargement de page, sans jamais
      // bloquer un utilisateur sur une version obsolète.
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'ComHub — Plateforme Multi-Organisations',
        short_name: 'ComHub',
        description: 'Messagerie, groupes, événements et finances pour les églises, entreprises et ONG.',
        lang: 'fr',
        theme_color: '#D97706',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Ne met en cache que ce que Vite a construit (JS/CSS/icônes) —
        // jamais les appels réseau vers Supabase, pour ne jamais servir de
        // données périmées ou casser l'authentification hors-ligne.
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
    }),
  ],
})
