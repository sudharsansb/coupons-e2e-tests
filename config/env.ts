import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const environments = ['local', 'staging'];
const testEnv = process.env.TEST_ENV ?? 'local';

if (!environments.includes(testEnv)) {
    throw new Error(
        `Unrecognised value set to env var TEST_ENV "${testEnv}". Expected one of : "${environments.join(', ')} `,
    );
}

const envFile = path.resolve(__dirname, '..', `.env.${testEnv}`);

if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, quiet: true });
} else if (!process.env.CI) {
    throw new Error(
        `Missing ${path.basename(envFile)}. Copy .env.example to .env.${testEnv} and fill it in.`,
    );
}

function read(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env var "${name}" for TEST_ENV=${testEnv}`);
    return value;
}

export const env = {
    name: testEnv,
    baseURL: read('BASE_URL'),
    username: read('APP_USERNAME'),
    password: read('APP_PASSWORD'),
} as const;

export const AUTH_FILE = 'playwright/.auth/user.json';

export const CART_STORAGE_KEY = 'waracle_cart';
