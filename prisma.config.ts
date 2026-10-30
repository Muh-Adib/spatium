import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/schema.prisma",
    db: {
      connection: process.env['DATABASE_URL'] || 'postgresql://segiatech:segiatech_secret@localhost:5433/segiatech?schema=public',
    },
  }),
});
