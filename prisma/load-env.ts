import { config as loadDotenv } from "dotenv";

export function loadPrismaEnvironment() {
  loadDotenv({
    path: [".env.local", ".env"],
    quiet: true,
  });
}
