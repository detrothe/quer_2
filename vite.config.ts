import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    // relative Pfade, damit die App auch in einem Unterverzeichnis läuft
    base: './',
    // three.js ist als eigener, nachgeladener Chunk bewusst groß
    build: {chunkSizeWarningLimit: 800},
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['polyquer.png'],
            manifest: {
                name: 'polygonal begrenzter Querschnitt',
                short_name: 'polyQuer',
                description: 'Querschnittswerte und Spannungen eines polygonal begrenzten Querschnitts',
                lang: 'de',
                start_url: './',
                scope: './',
                display: 'standalone',
                background_color: '#ffffff',
                theme_color: '#800080',
                icons: [
                    {
                        src: 'polyquer.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,woff2}'],
            },
        }),
    ],
});
