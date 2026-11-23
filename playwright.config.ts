import { defineConfig, devices } from '@playwright/test'

// WebGL trên máy CI không có GPU: dùng SwiftShader (render bằng CPU)
const webgl = {
  launchOptions: {
    // Cho phép dùng Chrome có sẵn trên máy: CHROME_PATH=/usr/bin/google-chrome npm run e2e
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  },
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...webgl } },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...webgl } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
