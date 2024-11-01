import {defineConfig, loadEnv} from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import * as fs from "node:fs";

export default defineConfig(({command, mode}) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            laravel({
                input: 'resources/js/app.jsx',
                refresh: true,
            }),
            react(),
        ],
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            https: env.VITE_SCHEME === 'https' && {
                cert: fs.readFileSync(env.VITE_SSL_CERTIFICATE),
                key: fs.readFileSync(env.VITE_SSL_CERTIFICATE_KEY),
            },
            hmr: {
                host: env.VITE_HOST,
            }
        }
    };
});
