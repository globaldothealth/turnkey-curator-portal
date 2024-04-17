import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    // depending on your application, base can also be "/"
    base: '',
    plugins: [react(), viteTsconfigPaths()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        css: true,
        reporters: ['verbose'],
        // coverage: {
        //     reporter: ['text', 'json', 'html'],
        //     include: ['src/**/*'],
        //     exclude: [],
        // },
    },
    server: {
        // this ensures that the browser opens upon server start
        // open: true,
        // this sets a default port to 3000
        host: true,
        port: 3002,
        cors: false,
        proxy: {
            '/api': {
                target: 'http://curator:3001',
                changeOrigin: true,
                secure: false,
            },
            '/auth': {
                target: 'http://curator:3001',
                changeOrigin: true,
                secure: false,
            },
            '/version': {
                target: 'http://curator:3001',
                changeOrigin: true,
                secure: false,
            },
            '/env': {
                target: 'http://curator:3001',
                changeOrigin: true,
                secure: false,
            },
            '/diseaseName': {
                target: 'http://curator:3001',
                changeOrigin: true,
                secure: false,
            },
            '/feedback': {
                target: 'http://curator:3001',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
