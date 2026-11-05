import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Loopback only (IPv4). Pass Vite's host flag with an address to expose
    // the dev server on another interface deliberately.
    host: '127.0.0.1',
    port: 5174,
  },
});
