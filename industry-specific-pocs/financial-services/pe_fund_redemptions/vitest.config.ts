import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest config for the PE fund redemptions frontend.
// Scoped to pure-logic unit tests that do not require the deploy-time
// amplify_outputs.json (which main.tsx imports and is .gitignored).
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
