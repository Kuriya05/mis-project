import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

/** TEST_DATABASE_URL from the environment or backend/.env. It must name a *_test database. */
export function testDatabaseUrl(): string {
  loadDotenv({ path: resolve(__dirname, '../../.env'), quiet: true });
  const url = process.env.TEST_DATABASE_URL?.trim();
  if (!url) {
    throw new Error('TEST_DATABASE_URL is not set (see backend/.env.example)');
  }
  if (!new URL(url).pathname.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must point at a database whose name ends in _test');
  }
  return url;
}
