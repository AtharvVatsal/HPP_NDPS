import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: '/index.html',
  },
  // Single-page setup. Letters generator is the only entry point; the older
  // dossier and dashboard apps are archived in scraps/ and not built.
});
