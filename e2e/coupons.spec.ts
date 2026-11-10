import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { ProductsPage, ProductSummary } from '../pages/products.page';
import { CartPage } from '../pages/cart.page';
import { sumOfPrices } from '../utils/pricing';

const VALID_COUPON = 'WARACLE25';
const INVALID_COUPON = 'INVALIDCOUPONCODE';
const SHIPPING_CHARGE = 5;
const DISCOUNT_RATE = 0.25;

test.describe('Shopping Cart', () => {
    let homePage: HomePage;
    let productsPage: ProductsPage;
    let cartPage: CartPage;
    let productsToAdd: ProductSummary[];

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        productsPage = new ProductsPage(page);
        cartPage = new CartPage(page);

        await test.step('Open Home page', async () => {
            await homePage.goto();
            await expect(homePage.pageHeading).toBeVisible();
            await expect(homePage.header.signOutButton).toBeVisible();
        });

        await test.step('Open Products page', async () => {
            await homePage.clickShopNow();
            await expect(page).toHaveURL(/\/products$/);
            await expect(productsPage.pageHeading).toBeVisible();
        });

        await test.step('Choose products to add', async () => {
            const visibleProducts = await productsPage.getProducts();
            const uniqueProducts = visibleProducts.filter(
                (product, index, all) => all.findIndex((p) => p.name === product.name) === index,
            );
            productsToAdd = uniqueProducts.slice(0, 2); // Add >1 product to verify coupons apply on all products
            expect(productsToAdd).toHaveLength(2);
            for (const product of productsToAdd) {
                console.log(`${product.name}: ${product.price.toFixed(2)}`);
            }
        });

        await test.step('Ensure Cart is empty before adding products', async () => {
            expect(await productsPage.header.getCartCount()).toBe(0);
        });

        await test.step('Add the planned products to the cart', async () => {
            for (const product of productsToAdd) {
                await productsPage.addToCart(product.name);
            }
        });

        await test.step('Cart badge matches the number of products added', async () => {
            await expect.poll(() => productsPage.header.getCartCount()).toBe(productsToAdd.length);
        });

        await test.step('Open the cart page', async () => {
            await productsPage.header.openCart();
            await expect(page).toHaveURL(/\/cart$/);
            await expect(cartPage.pageHeading).toBeVisible();
        });

        await test.step('Cart lists the products that were added', async () => {
            expect(await cartPage.getCartItemNames()).toEqual(productsToAdd.map((p) => p.name));
        });
    });

    test(
        'Discount is applied when a valid coupon code is used',
        { tag: ['@AC-1', '@AC-2', '@AC-3', '@AC-4'] },
        async () => {
            let expectedSubtotal = 0;
            for (const product of productsToAdd) {
                expectedSubtotal += product.price;
            }
            const expectedDiscount = Math.round(expectedSubtotal * 100 * DISCOUNT_RATE) / 100;
            const expectedShippingCharge = SHIPPING_CHARGE;
            const expectedTotal = expectedSubtotal - expectedDiscount + expectedShippingCharge;

            await test.step(`Apply valid coupon code ${VALID_COUPON} (AC-1)`, async () => {
                await cartPage.applyCoupon(VALID_COUPON);
            });

            await test.step('Verify Coupon confirmation message is shown (AC-6)', async () => {
                await expect(cartPage.couponMessage).toBeVisible();
                await expect(cartPage.couponMessage).toHaveText(`Coupon “${VALID_COUPON}” applied`);
            });

            await test.step('Verify actual sub total matches sum of prices added to the cart', async () => {
                const actualSubtotal = await cartPage.getSubtotal();
                expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 2);
            });

            await test.step('Verify Shipping cost is £5.00 (AC-3)', async () => {
                const actualShippingCharge = await cartPage.getShippingCharge();
                expect(actualShippingCharge).toBe(expectedShippingCharge);
            });

            await test.step('Verify Discount is 25% of the subtotal (AC-2)', async () => {
                const actualDiscount = await cartPage.getDiscount();
                expect(actualDiscount).toBeCloseTo(expectedDiscount, 2);
            });

            await test.step('Verify Total is subtotal − discount + shipping (AC-4)', async () => {
                const actualTotal = await cartPage.getTotal();
                expect(actualTotal).toBeCloseTo(expectedTotal, 2);
            });
        },
    );

    test(
        'Discount is NOT applied when an invalid coupon code is used',
        { tag: ['@AC-5'] },
        async () => {
            let expectedSubtotal = 0;
            for (const product of productsToAdd) {
                expectedSubtotal += product.price;
            }
            const expectedShippingCharge = SHIPPING_CHARGE;
            const expectedTotal = expectedSubtotal + expectedShippingCharge;

            await test.step(`Apply invalid coupon code ${INVALID_COUPON}`, async () => {
                await cartPage.applyCoupon(INVALID_COUPON);
            });

            await test.step('Verify successful coupon code application message is NOT shown', async () => {
                await expect(
                    cartPage.orderSummary.getByText(`Coupon “${INVALID_COUPON}” applied`),
                ).toBeHidden();
            });

            await test.step('Verify no discount line is shown (AC-5)', async () => {
                await expect(cartPage.discountRow).toBeHidden();
                expect(await cartPage.getDiscount()).toBeNull();
            });

            await test.step('Verify actual sub total matches sum of prices added to the cart', async () => {
                const actualSubtotal = await cartPage.getSubtotal();
                expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 2);
            });

            await test.step('Verify Shipping cost is £5.00 (AC-3)', async () => {
                const actualShippingCharge = await cartPage.getShippingCharge();
                expect(actualShippingCharge).toBe(expectedShippingCharge);
            });

            await test.step('Verify Total is subtotal + shipping with no discount (AC-4)', async () => {
                const actualTotal = await cartPage.getTotal();
                expect(actualTotal).toBeCloseTo(expectedTotal, 2);
            });

            await test.step('Verify a clear error message is shown (AC-5)', async () => {
                await expect.soft(cartPage.couponMessage).toBeVisible();
            });
        },
    );

    test(
        'Discount is NOT applied when an empty coupon code is used',
        { tag: ['@AC-5'] },
        async () => {
            const expectedSubtotal = sumOfPrices(productsToAdd);
            const expectedShippingCharge = SHIPPING_CHARGE;
            const expectedTotal = expectedSubtotal + expectedShippingCharge;

            await test.step('Apply an empty coupon code', async () => {
                await cartPage.applyCoupon('');
            });

            await test.step('Verify no success message is shown', async () => {
                await expect(cartPage.orderSummary.getByText(/applied/i)).toBeHidden();
            });

            await test.step('Verify no discount line is shown (AC-5)', async () => {
                await expect(cartPage.discountRow).toBeHidden();
                expect(await cartPage.getDiscount()).toBeNull();
            });

            await test.step('Verify actual sub total matches sum of prices added to the cart', async () => {
                const actualSubtotal = await cartPage.getSubtotal();
                expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 2);
            });

            await test.step('Verify Shipping cost is £5.00 (AC-3)', async () => {
                const actualShippingCharge = await cartPage.getShippingCharge();
                expect(actualShippingCharge).toBe(expectedShippingCharge);
            });

            await test.step('Verify Total is subtotal + shipping with no discount (AC-4)', async () => {
                const actualTotal = await cartPage.getTotal();
                expect(actualTotal).toBeCloseTo(expectedTotal, 2);
            });

            await test.step('Verify a clear error message is shown (AC-5)', async () => {
                await expect.soft(cartPage.couponMessage).toBeVisible();
            });
        },
    );

    test(
        'Discount is NOT applied multiple times when a valid coupon is applied twice',
        { tag: ['@AC-2', '@AC-4'] },
        async () => {
            let discountAfterFirstApply: number | null;
            let totalAfterFirstApply: number;

            await test.step(`Apply valid coupon code ${VALID_COUPON} for the first time`, async () => {
                await cartPage.applyCoupon(VALID_COUPON);
                await expect(cartPage.couponMessage).toHaveText(`Coupon “${VALID_COUPON}” applied`);
                await expect(cartPage.discountRow).toBeVisible();
                discountAfterFirstApply = await cartPage.getDiscount();
                totalAfterFirstApply = await cartPage.getTotal();
            });

            await test.step(`Apply the same coupon code ${VALID_COUPON} again`, async () => {
                await cartPage.applyCoupon(VALID_COUPON);
                await expect(cartPage.couponMessage).toBeVisible();
            });

            await test.step('Verify only one discount line is shown', async () => {
                await expect(cartPage.discountRow).toHaveCount(1);
            });

            await test.step('Verify discount is unchanged after the second apply', async () => {
                const actualDiscount = await cartPage.getDiscount();
                expect(discountAfterFirstApply).not.toBeNull();
                expect(actualDiscount).toBeCloseTo(discountAfterFirstApply as number, 2);
            });

            await test.step('Verify total is unchanged after the second apply', async () => {
                const actualTotal = await cartPage.getTotal();
                expect(actualTotal).toBeCloseTo(totalAfterFirstApply, 2);
            });
        },
    );
});
