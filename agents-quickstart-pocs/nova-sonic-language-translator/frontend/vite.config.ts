import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
      host: '0.0.0.0',  // Force IPv4

    port: 5174,
  },
});
