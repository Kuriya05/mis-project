import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROUTES_OUTSIDE_API_PREFIX, configureApp } from '../../src/app-setup';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Boots the real application - global guards, pipes, interceptor, filter, the
 * /api prefix and configureApp(), exactly as main.ts does - against the test
 * database.
 *
 * `env` is applied only while the module compiles, which is when the
 * configuration is read, so each suite can boot with its own limits without
 * leaking them into the next one.
 */
export async function bootApp(env: Record<string, string> = {}): Promise<NestExpressApplication> {
  const previous = new Map(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);

  try {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    // The same two calls main.ts makes.
    app.setGlobalPrefix('api', { exclude: ROUTES_OUTSIDE_API_PREFIX });
    configureApp(app);
    await app.init();
    return app;
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

/** Empties every table, keeping the schema. */
export async function resetDatabase(app: NestExpressApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE question_bookmarks, comment_votes, question_votes, comments, question_tags, questions, tags, profiles RESTART IDENTITY CASCADE',
  );
}
