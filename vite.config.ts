import path from 'path';import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,
    hmr: {
      clientPort: 5173,
      host: 'localhost',
      protocol: 'ws',
      timeout: 30000,
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
