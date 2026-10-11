import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: { channel: 'chromium', baseURL: 'http://127.0.0.1:5187', viewport: { width: 1920, height: 1080 }, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', colorScheme: 'dark', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'pnpm exec vite --host 127.0.0.1 --port 5187 --strictPort', url: 'http://127.0.0.1:5187', reuseExistingServer: false, timeout: 30000 },
});
