import {defineConfig} from 'vitest/config';

export default defineConfig(({mode}) => ({
    test: {
        environment: 'jsdom',
        include: ['scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        reporters: [
            ['vitest-trx-results-processor', {outputFile: 'testresults/test-results.trx'}]
        ],
    },
    define: {
        'import.meta.vitest': mode !== 'production',
    },
    build: {
        target: 'es2022'
    }
}));
