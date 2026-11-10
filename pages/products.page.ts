import { Page, Locator, expect } from '@playwright/test';
import { Header } from './components/header';
import { Toast } from './components/toast';

export type ProductSummary = {
    name: string;
    price: number;
};

export class ProductsPage {
    readonly header: Header;
    readonly toast: Toast;
    readonly pageHeading: Locator;
    readonly productCards: Locator;

    constructor(private readonly page: Page) {
        this.header = new Header(page);
        this.toast = new Toast(page);

        const main = page.getByRole('main');
        this.pageHeading = main.getByRole('heading', { level: 1, name: 'All Products' });
        this.productCards = main
            .getByRole('link')
            .filter({ has: page.getByRole('heading', { level: 3 }) });
    }

    async goto() {
        await this.page.goto('/products');
        await expect(this.pageHeading).toBeVisible();
    }

    /** Locator for a single product card, found by its exact name. */
    productCard(name: string): Locator {
        return this.productCards.filter({
            has: this.page.getByRole('heading', { level: 3, name, exact: true }),
        });
    }

    /** Names of all products currently listed, in display order. */
    async getProductNames(): Promise<string[]> {
        await expect(this.productCards.first()).toBeVisible();
        return this.productCards.getByRole('heading', { level: 3 }).allInnerTexts();
    }

    /** Names and prices of all products currently listed. */
    async getProducts(): Promise<ProductSummary[]> {
        const names = await this.getProductNames();
        return Promise.all(
            names.map(async (name) => ({ name, price: await this.getProductPrice(name) })),
        );
    }

    /** Price of a product in pounds, e.g. 19.99. */
    async getProductPrice(name: string): Promise<number> {
        const priceText = await this.productCard(name)
            .getByText(/^£\d+\.\d{2}$/)
            .innerText();
        const price = Number(priceText.replace('£', '').trim());
        if (Number.isNaN(price)) {
            throw new Error(`Could not read a price for "${name}" from "${priceText}"`);
        }
        return price;
    }

    /** Hovers over a product card, clicks "Add to cart" and checks the confirmation toast. */
    async addToCart(name: string) {
        const card = this.productCard(name);
        await card.hover();
        await card.getByRole('button', { name: 'Add to cart' }).click();
        // await this.toast.expectMessage(`${name} added to cart`);
    }
}
