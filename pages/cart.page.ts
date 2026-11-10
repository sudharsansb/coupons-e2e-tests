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
        // The only paragraph in the summary is the coupon feedback message
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

    /** Names of the products listed in the cart, in display order. */
    async getCartItemNames(): Promise<string[]> {
        await expect(this.pageHeading).toBeVisible();
        return this.cartItemNames.allInnerTexts();
    }

    /** Types a coupon code and clicks Apply. Assert the outcome in the test. */
    async applyCoupon(code: string) {
        await this.couponInput.fill(code);
        await this.applyCouponButton.click();
    }

    /** Coupon feedback text, e.g. 'Coupon “WARACLE25” applied'; null when no message is shown. */
    async getCouponMessage(): Promise<string | null> {
        if (!(await this.couponMessage.isVisible())) return null;
        return (await this.couponMessage.innerText()).trim();
    }

    /** Subtotal in pounds, e.g. 44.98. */
    async getSubtotal(): Promise<number> {
        return this.readAmount(this.summaryValue('Subtotal'));
    }

    /** Coupon discount in pounds as a positive number, e.g. 0.25; null when no coupon is applied. */
    async getDiscount(): Promise<number | null> {
        if ((await this.discountRow.count()) === 0) return null;
        return this.readAmount(this.discountRow.locator('xpath=following-sibling::span'));
    }

    /** Shipping charge in pounds, e.g. 5. */
    async getShippingCharge(): Promise<number> {
        return this.readAmount(this.summaryValue('Shipping'));
    }

    /** Grand total in pounds shown under Total, e.g. 49.73. */
    async getTotal(): Promise<number> {
        return this.readAmount(this.summaryValue('Total'));
    }

    async proceedToCheckout() {
        await this.proceedToCheckoutButton.click();
    }

    /** Value cell next to a summary label such as 'Subtotal' or 'Total'. */
    private summaryValue(label: string): Locator {
        return this.orderSummary
            .getByText(label, { exact: true })
            .locator('xpath=following-sibling::span');
    }

    /** Converts a displayed amount such as '£44.98' or '–£0.25' to a positive number. */
    private async readAmount(locator: Locator): Promise<number> {
        const text = await locator.innerText();
        const amount = Number(text.replace(/[£–−-]/g, '').trim());
        if (Number.isNaN(amount)) {
            throw new Error(`Could not read an amount from "${text}"`);
        }
        return amount;
    }
}
