import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  build: { outDir: 'dist', sourcemap: true },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  worker: { format: 'es' }, // Enable Web Worker import
  define: {
    'import.meta.env.VITE_LLM_API_KEY': JSON.stringify(process.env.VITE_LLM_API_KEY || ''),
    'import.meta.env.VITE_LLM_ENDPOINT': JSON.stringify(process.env.VITE_LLM_ENDPOINT || ''),
  },
});