import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: 3,
  timeout: 50000,
  use: {
    baseURL: 'https://www.girikon.com/',
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
});
