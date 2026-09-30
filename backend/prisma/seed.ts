import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { loadSampleData } from '../src/sample-data/sample-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

loadSampleData(prisma)
  .then(({ questions, comments }) => {
    console.log(`Seed completed: ${questions} questions, ${comments} comments`);
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
