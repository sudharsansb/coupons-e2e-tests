import { Page, expect } from '@playwright/test';

export class Toast {
    constructor(private readonly page: Page) {}

    /** Asserts a toast with exactly this message is shown. */
    async expectMessage(message: string) {
        await expect(this.page.getByText(message, { exact: true }).last()).toBeVisible();
    }
}
