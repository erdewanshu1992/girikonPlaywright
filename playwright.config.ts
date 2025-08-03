// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['allure-playwright', {
      detail: true,
      suiteTitle: false,
      environmentInfo: {
        test_case_id: 'Test-1',
      },
    }],
  ],
  use: {
    baseURL: 'https://www.girikon.com/',
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'  
  },
});









/*
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: 3,
  timeout: 50000,
  reporter: [
  ['list'],
  ['allure-playwright'],
  ],
  use: {
    baseURL: 'https://www.girikon.com/',
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
});
*/
