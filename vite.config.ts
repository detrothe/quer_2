import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
    // relative Pfade, damit die App auch in einem Unterverzeichnis läuft
    base: './',
    // three.js ist als eigener, nachgeladener Chunk bewusst groß
    build: {chunkSizeWarningLimit: 800},
    // Versionsnummer für den Tab Info
    define: {__APP_VERSION__: JSON.stringify(pkg.version)},
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
                // keine Themenfarbe: Browser-/Statusleiste behält die Standardfarbe des Browsers.
                // Ausdrücklich undefined, sonst setzt vite-plugin-pwa ihr Standardgrün #42b883 ein.
                theme_color: undefined,
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
