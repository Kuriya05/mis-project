import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { testDatabaseUrl } from './helpers/test-database';

/** Brings the test database to the latest migration once per run (creates it if missing). */
export default function globalSetup(): void {
  execSync(`"${process.execPath}" node_modules/prisma/build/index.js migrate deploy`, {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'pipe',
  });
}
