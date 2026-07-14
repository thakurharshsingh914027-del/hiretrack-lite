import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "@/lib/db/client";
import { parseDatabaseRuntimeEnv } from "@/lib/env";

const globalForPrisma = globalThis as typeof globalThis & {
  hireTrackPrisma?: PrismaClient;
};

export function getDatabase(): PrismaClient {
  if (!globalForPrisma.hireTrackPrisma) {
    // Keep static Next.js collection/builds database-free. Any request that
    // actually reaches a data path still fails closed when the placeholder is
    // unreachable; deployed environments must provide DATABASE_URL.
    const DATABASE_URL =
      process.env.DATABASE_URL ??
      "postgresql://missing:missing@127.0.0.1:1/missing_database_configuration";
    if (process.env.DATABASE_URL) parseDatabaseRuntimeEnv(process.env);
    globalForPrisma.hireTrackPrisma = createPrismaClient(DATABASE_URL);
  }

  return globalForPrisma.hireTrackPrisma;
}
