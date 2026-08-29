import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    ssr: 'smoke/entry.jsx',
    outDir: 'smoke/dist',
    rollupOptions: { external: ['react', 'react-dom', 'react-dom/server', 'react-router-dom'] }
  }
});
