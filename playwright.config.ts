import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const rawRunLabel = process.env.PW_RUN_LABEL ?? 'all-projects';
const runLabel = rawRunLabel.replace(/[^a-zA-Z0-9-_]/g, '_');

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  outputDir: path.join('test-results', runLabel),
  reporter: [
    ['list'],
    ['html', {
      open: 'never',
      outputFolder: path.join('playwright-report', runLabel)
      }]],
  use: {
    baseURL: 'https://www.linkedin.com',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  globalSetup: require.resolve('./tests/global-setup'),
  projects: [
    {
      name: 'chrome-desktop',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
      },
    },
    {
      name: 'edge-desktop',
      use: {
        browserName: 'chromium',
        channel: 'msedge',
      },
    },
    {
      name: 'chrome-iphone13',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        channel: 'chrome',
      },
    },
    {
      name: 'edge-galaxys9',
      use: {
        ...devices['Galaxy S9+'],
        browserName: 'chromium',
        channel: 'msedge',
      },
    },
  ],
});
