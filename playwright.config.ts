import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '4321';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './test',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
  webServer: {
    // The test server mirrors GitHub Pages MIME types and its custom 404
    // contract, while PLAYWRIGHT_PORT keeps parallel work isolated.
    command: 'node scripts/serve-build.mjs',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
