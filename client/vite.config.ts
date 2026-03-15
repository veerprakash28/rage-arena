import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@rage-arena/shared': path.resolve(__dirname, '../shared/src/index.ts'),
        },
    },
    server: {
        port: 3000,
    },
});
