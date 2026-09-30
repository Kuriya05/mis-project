import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// datasource is attached only when DATABASE_URL is set, so `prisma generate`
// (postinstall) works on a fresh clone / CI before any .env exists.
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
