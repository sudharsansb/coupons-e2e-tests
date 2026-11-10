import { Page, Locator, expect } from '@playwright/test';
import { Header } from './components/header';
import { Toast } from './components/toast';

export class CartPage {
    readonly header: Header;
    readonly toast: Toast;
    readonly pageHeading: Locator;
    readonly cartItemNames: Locator;
    readonly orderSummary: Locator;
    readonly couponInput: Locator;
    readonly applyCouponButton: Locator;
    readonly couponMessage: Locator;
    readonly discountRow: Locator;
    readonly proceedToCheckoutButton: Locator;

    constructor(private readonly page: Page) {
        this.header = new Header(page);
        this.toast = new Toast(page);

        const main = page.getByRole('main');
        this.pageHeading = main.getByRole('heading', { level: 1, name: 'Shopping Cart' });
        this.cartItemNames = main.getByRole('heading', { level: 3 });

        this.orderSummary = main
            .locator('aside')
            .filter({ has: page.getByRole('heading', { name: 'Order Summary' }) });
        this.couponInput = this.orderSummary.getByPlaceholder('e.g. WARACLE25');
        this.applyCouponButton = this.orderSummary.getByRole('button', { name: 'Apply' });
        this.couponMessage = this.orderSummary.locator('p');
        this.discountRow = this.orderSummary.getByText(/^Coupon \(.+\)$/);
        this.proceedToCheckoutButton = this.orderSummary.getByRole('button', {
            name: 'Proceed to Checkout',
        });
    }

    async goto() {
        await this.page.goto('/cart');
        await expect(this.pageHeading).toBeVisible();
    }

    async getCartItemNames(): Promise<string[]> {
        await expect(this.pageHeading).toBeVisible();
        return this.cartItemNames.allInnerTexts();
    }

    async applyCoupon(code: string) {
        await this.couponInput.fill(code);
        await this.applyCouponButton.click();
    }

    async getCouponMessage(): Promise<string | null> {
        if (!(await this.couponMessage.isVisible())) return null;
        return (await this.couponMessage.innerText()).trim();
    }

    async getSubtotal(): Promise<number> {
        return this.readAmount(this.summaryValue('Subtotal'));
    }

    async getDiscount(): Promise<number | null> {
        if ((await this.discountRow.count()) === 0) return null;
        return this.readAmount(this.discountRow.locator('xpath=following-sibling::span'));
    }

    async getShippingCharge(): Promise<number> {
        return this.readAmount(this.summaryValue('Shipping'));
    }

    async getTotal(): Promise<number> {
        return this.readAmount(this.summaryValue('Total'));
    }

    async proceedToCheckout() {
        await this.proceedToCheckoutButton.click();
    }

    private summaryValue(label: string): Locator {
        return this.orderSummary
            .getByText(label, { exact: true })
            .locator('xpath=following-sibling::span');
    }

    private async readAmount(locator: Locator): Promise<number> {
        const text = await locator.innerText();
        const amount = Number(text.replace(/[£–−-]/g, '').trim());
        if (Number.isNaN(amount)) {
            throw new Error(`Could not read an amount from "${text}"`);
        }
        return amount;
    }
}
