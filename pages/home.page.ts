import { Page, Locator } from '@playwright/test';
import { Header } from './components/header';

export class HomePage {
    readonly header: Header;
    readonly pageHeading: Locator;
    readonly shopNowLink: Locator;

    constructor(private readonly page: Page) {
        this.header = new Header(page);

        const main = page.getByRole('main');
        this.pageHeading = main.getByRole('heading', {
            level: 1,
            name: 'Digital products trusted by millions of people',
        });
        this.shopNowLink = main.getByRole('link', { name: 'Shop Now' });
    }

    async goto() {
        await this.page.goto('/');
    }

    async clickShopNow() {
        await this.shopNowLink.click();
    }

    async getCartCount(): Promise<number> {
        return this.header.getCartCount();
    }
}
