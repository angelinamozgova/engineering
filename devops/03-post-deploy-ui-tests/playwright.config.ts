// start: Playwright config — static fixture server for health checks
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx serve fixture -l 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
// end: Playwright config — static fixture server for health checks