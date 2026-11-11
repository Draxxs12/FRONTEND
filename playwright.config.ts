   import { defineConfig, devices } from '@playwright/test';

   export default defineConfig({
     testDir: './e2e',
     reporter: [['html', { open: 'never' }], ['list']],
     use: { baseURL: 'http://localhost:4200', trace: 'on-first-retry', screenshot: 'only-on-failure' },
     projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
     webServer: { command: 'npm start', url: 'http://localhost:4200', reuseExistingServer: true, timeout: 120_000 },
   });