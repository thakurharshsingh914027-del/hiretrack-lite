import { defineConfig } from "prisma/config";

import { loadPrismaEnvironment } from "./prisma/load-env";

loadPrismaEnvironment();

const generateOnlyDatabaseUrl =
  "postgresql://missing:missing@127.0.0.1:1/missing_database_configuration";

const cliDatabaseUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? generateOnlyDatabaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: cliDatabaseUrl,
  },
});
