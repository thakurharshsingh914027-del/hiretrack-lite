import { createPrismaClient } from "../src/lib/db/client";
import { seedDemoDatabase } from "../src/lib/db/seed";
import { parseDatabaseRuntimeEnv, parseSeedEnv } from "../src/lib/env";
import { loadPrismaEnvironment } from "./load-env";

loadPrismaEnvironment();

const databaseEnv = parseDatabaseRuntimeEnv(process.env);
const seedEnv = parseSeedEnv(process.env);
const database = createPrismaClient(databaseEnv.DATABASE_URL);

try {
  const summary = await seedDemoDatabase(database, {
    organizationName: seedEnv.DEMO_ORGANIZATION_NAME,
    adminName: seedEnv.DEMO_ADMIN_NAME,
    adminEmail: seedEnv.DEMO_ADMIN_EMAIL,
    adminPassword: seedEnv.DEMO_ADMIN_PASSWORD,
  });

  console.info(
    `Seeded HireTrack demo: ${summary.jobs} jobs, ${summary.candidates} candidates, ${summary.applications} applications, ${summary.interviews} interviews.`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown seed error";
  console.error(`HireTrack demo seed failed: ${message}`);
  process.exitCode = 1;
} finally {
  await database.$disconnect();
}
