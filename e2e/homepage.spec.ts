import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe.skip('Home Page', () => {
    test('Successfully logged user can access products page', async ({ page }) => {
        const homePage = new HomePage(page);
        let cartCountAfterLogin: number;
        let cartCountAfterProductPageLanding: number;

        await test.step('Open home page', async () => {
            await homePage.goto();
            await expect(homePage.pageHeading).toBeVisible();
            await expect(homePage.header.signOutButton).toBeVisible(); // best guess for succesful sign in
            cartCountAfterLogin = await homePage.getCartCount();
        });

        await test.step('Open Products Page', async () => {
            await homePage.clickShopNow();
            cartCountAfterProductPageLanding = await homePage.getCartCount();
            expect(cartCountAfterProductPageLanding).toBe(cartCountAfterLogin); // ensure a clean state
        });
    });
});
