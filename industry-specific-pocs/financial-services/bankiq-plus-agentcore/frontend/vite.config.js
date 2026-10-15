import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Migrated from Create React App (react-scripts) to Vite.
// - JSX is allowed in .js files (CRA convention) via the esbuild loader below,
//   so no source files need renaming to .jsx.
// - outDir is 'build' to preserve the existing Dockerfile/nginx paths.
// - The dev proxy replaces CRA's package.json "proxy": "http://localhost:3001".
export default defineConfig({
  plugins: [react()],
  // Allow JSX syntax inside plain .js files (CRA behavior).
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
