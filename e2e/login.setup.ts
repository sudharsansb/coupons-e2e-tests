import { test as setup, expect } from '@playwright/test';
import { env, AUTH_FILE, CART_STORAGE_KEY } from '../config/env';

setup('login and save the state', async ({ page }) => {
    await setup.step('Open Waracle shop web page', async () => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Account' }).click();
    });

    await setup.step('Submit credentials', async () => {
        await page.locator('#email').fill(env.username);
        await page.locator('#password').fill(env.password);
        await page.getByRole('button', { name: 'Sign In' }).click();
    });

    await setup.step('Verify logged in', async () => {
        const header = page.getByRole('banner');
        await expect(header.getByRole('button', { name: 'Sign out' })).toBeVisible();
        await expect(header.getByText('Hi, John')).toBeVisible();
    });

    await setup.step('Ensure every test starts with empty cart', async () => {
        await page.evaluate((key) => localStorage.setItem(key, '[]'), CART_STORAGE_KEY);
    });

    await page.context().storageState({ path: AUTH_FILE });
});
