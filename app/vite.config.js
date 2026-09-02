import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiPlugin } from './vite.plugin.api.js';

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: { host: '0.0.0.0', port: 5174, strictPort: true },
  preview: { host: '0.0.0.0', port: 4174, strictPort: true }
});
