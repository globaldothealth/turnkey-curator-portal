import { defineConfig } from 'cypress';

export default defineConfig({
    videoCompression: false,
    videoUploadOnPasses: false,
    viewportWidth: 1920,
    viewportHeight: 1080,
    defaultCommandTimeout: 30000,
    execTimeout: 70000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    projectId: 'dpghvb',
    e2e: {
        // We've imported your old cypress plugins here.
        // You may want to clean this up later by importing these.
        setupNodeEvents(on, config) {
            return require('./cypress/plugins/index.ts')(on, config);
        },
        experimentalRunAllSpecs: true,
        baseUrl: 'http://localhost:3002',
        specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    },
});
