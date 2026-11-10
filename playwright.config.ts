import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';
const authFile = 'playwright/.auth/user.json';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: env.baseURL,
        headless: false,
        trace: 'on',
        screenshot: 'on',
        video: 'retain-on-failure',
    },
    metadata: {
        environment: env.name,
        baseURL: env.baseURL,
    },
    projects: [
        { name: 'setup', testMatch: /.*\.setup\.ts/ }, // Login once and save the session for other tests
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'], storageState: authFile },
            dependencies: ['setup'],
        },
    ],
});
