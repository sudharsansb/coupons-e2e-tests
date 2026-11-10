import { Page, expect } from '@playwright/test';

export class Toast {
    constructor(private readonly page: Page) {}

    async expectMessage(message: string) {
        await expect(this.page.getByText(message, { exact: true }).last()).toBeVisible();
    }
}
