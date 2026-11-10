# Waracle Store – Coupon Code E2E Tests
Automated web e2e tests for the release `WS-101: Coupon codes at checkout` at checkout on the Waracle Store web app

## Prerequisites
- Node.js 20 or later (tested with v23.6.1)
- npm 10 or later (tested with v11.3.0)
- Git
- The Waracle Store web app running locally at http://localhost:5173

## Installation
```
git clone https://github.com/sudharsansb/coupons-e2e-tests.git
cd coupon-e2e-tests
npm ci
npx playwright install
npx playwright install --with-deps
```

### Configure the environment
Credentials are not source controlled. Copy the example env file and fill in the valid values:
```
cp .env.example .env.local
```
The environment is selected with TEST_ENV (defaults to local).

## Running the tests
Make sure that web app under test is running locally.
To execute all the tests, issue this command.
```
npm run test:local
```

## How it works
- Login once: e2e/login.setup.ts signs in as the demo user and saves the session. All other tests reuse it, so they start already logged in. This saves overall test execution time.
- Clean cart for every test: the cart lives in the browser's localStorage, so each test gets its own empty cart, even when tests run in parallel with one user. This adds stability to the tests.
- Page Object Model: locators and actions live in pages/ tests in e2e/ describe behaviour only.
Accessible locators: elements are found by role, label and visible text, the same way users and assistive technology find them.
- Independent expected values: expected totals are calculated from product prices, not read back from the app.

## Known issues

### BUG-01: 25% discount is not applied (High)
- Applying WARACLE25 deducts a flat £0.25 instead of 25% of the subtotal. Breaks AC-2
- The total formula (AC-4) works correctly; it is the discount amount that is wrong. Customers are told a coupon was applied but receive almost no discount.

### BUG-02: No message for an invalid or empty coupon (Medium)

- When an invalid or empty code is applied, no message is shown. The customer is not told that the coupon was rejected or that no discount applies. Breaks AC-5.

### BUG-03: Success message repeats on every click (Low)

- The coupon success toast appears every time Apply is clicked, even when the coupon is already applied. This is confusing and suggests the coupon is being applied again.

## Observations
- Case sensitivity (waracle25) is not specified. Although lowercase applies the discount. But I cannot add test case based on assumption.
- Removing or replacing an applied coupon is not specified.
- The release notes mention coupons at checkout, but AC-1 only covers the cart.

## Release recommendation
Not ready for release. The core feature is not working as expected. Customers will not get 25% discount. Instead get 25p discount. This is bad for reputation and could result in potential legal implications. I recommend fixing both Bugs 01 and 02 before the release and re-run this test suite to ensure the core functionality is working.
