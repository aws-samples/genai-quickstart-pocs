import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Loopback only (IPv4). Use `npm run dev -- --host <address>` to expose
    // the dev server on another interface deliberately.
    host: '127.0.0.1',
    port: 5174,
  },
});
