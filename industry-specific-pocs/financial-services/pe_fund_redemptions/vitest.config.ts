import { defineConfig } from 'vitest/config'

// Vitest config for the PE fund redemptions frontend.
// Scoped to pure-logic unit tests (session utils, agent-config constants) that
// need no DOM and no deploy-time amplify_outputs.json (which main.tsx imports
// and is .gitignored). Uses the lightweight node environment accordingly.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
