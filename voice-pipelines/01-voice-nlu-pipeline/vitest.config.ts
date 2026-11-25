import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['beauty-salon/**/*.test.ts'],
  },
});
