import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './schema.d';
import contractJson from './schema.json' with { type: 'json' };

export const contract = contractFromJson<Contract>(contractJson);

const createDatabase = () => postgres({
  contract,
  url: process.env['DATABASE_URL'] ||
    'postgresql://segiatech:segiatech_secret@localhost:5433/segiatech?schema=public',
});

type Database = ReturnType<typeof createDatabase>;
const globalForPrisma = globalThis as unknown as { prismaDb?: Database };

// Recreate database instance if missing or if schema has evolved (e.g. IndexingSubmission, Site)
const isInstanceStale = Boolean(
  globalForPrisma.prismaDb &&
  (!(globalForPrisma.prismaDb as any).orm?.public?.IndexingSubmission ||
   !(globalForPrisma.prismaDb as any).orm?.public?.Site)
);

export const db: Database = (!globalForPrisma.prismaDb || isInstanceStale)
  ? createDatabase()
  : globalForPrisma.prismaDb;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaDb = db;
