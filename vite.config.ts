import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Skip test files in Vite's transform pipeline
    {
      name: 'skip-test-files',
      load(id) {
        if (id.includes('/tests/') && (id.endsWith('.test.ts') || id.endsWith('.test.tsx'))) {
          return { code: '', map: null };
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts', './vitest.setup.ts'],
    css: true,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  server: { port: 5173, open: true },
  build: { outDir: 'dist', sourcemap: true },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  worker: { format: 'es' },
});