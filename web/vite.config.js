import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // URL do backend
        changeOrigin: true,
      },
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
});
