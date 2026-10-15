import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // server.js registers keep-alive setInterval timers for cache logging;
    // force the process to exit once tests finish so they don't hang the run.
    pool: 'forks',
    testTimeout: 15000,
  },
});
