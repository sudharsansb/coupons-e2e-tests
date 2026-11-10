import { Page, Locator } from '@playwright/test';

export class Header {
    readonly root: Locator;
    readonly signOutButton: Locator;
    readonly cart: Locator;
    readonly cartBadge: Locator;

    constructor(page: Page) {
        this.root = page.getByRole('banner');
        this.signOutButton = this.root.getByRole('button', { name: 'Sign out' });
        this.cart = this.root.getByRole('link', { name: 'Cart' });
        this.cartBadge = this.cart.locator('span');
    }

    async getCartCount(): Promise<number> {
        if ((await this.cartBadge.count()) === 0) return 0;
        const text = (await this.cartBadge.innerText()).trim();
        const count = Number.parseInt(text, 10);
        if (Number.isNaN(count)) {
            throw new Error(`Cart badge text is not a number: "${text}"`);
        }
        return count;
    }

    async openCart() {
        await this.cart.click();
    }
}
