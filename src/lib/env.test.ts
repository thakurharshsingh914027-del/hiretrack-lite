import { describe, expect, it } from "vitest";

import {
  parseDatabaseRuntimeEnv,
  parsePublicEnv,
  parseSeedEnv,
  parseServerEnv,
} from "@/lib/env";

const validServerEnv = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/hiretrack",
  DIRECT_URL: "postgresql://user:password@localhost:5432/hiretrack",
  AUTH_SECRET: "a-secure-test-secret-that-is-at-least-32-characters",
  AUTH_URL: "http://localhost:3000",
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "hello@example.com",
  BLOB_READ_WRITE_TOKEN: "vercel_blob_test",
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "upstash_test_token",
  DEMO_ORGANIZATION_NAME: "Acme Hiring",
  DEMO_ADMIN_NAME: "Demo Admin",
  DEMO_ADMIN_EMAIL: "demo@example.com",
  DEMO_ADMIN_PASSWORD: "correct-horse-battery-staple",
};

describe("environment validation", () => {
  it("uses a safe local canonical URL when no public URL is configured", () => {
    expect(parsePublicEnv({}).NEXT_PUBLIC_APP_URL).toBe(
      "http://localhost:3000",
    );
  });

  it("derives the canonical URL from the trusted Vercel production domain", () => {
    expect(
      parsePublicEnv({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "hiretrack-lite.vercel.app",
      }).NEXT_PUBLIC_APP_URL,
    ).toBe("https://hiretrack-lite.vercel.app");
  });

  it("rejects a localhost canonical URL on a production deployment", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        VERCEL_ENV: "production",
      }),
    ).toThrow(/Production metadata requires/);
  });

  it("accepts a complete server environment without OAuth", () => {
    expect(parseServerEnv(validServerEnv).DATABASE_URL).toBe(
      validServerEnv.DATABASE_URL,
    );
  });

  it("parses the database runtime contract without future service secrets", () => {
    expect(
      parseDatabaseRuntimeEnv({
        DATABASE_URL: "postgresql://user:password@localhost:5432/hiretrack",
      }),
    ).toEqual({
      DATABASE_URL: "postgresql://user:password@localhost:5432/hiretrack",
    });
  });

  it("rejects non-PostgreSQL runtime database URLs", () => {
    expect(() =>
      parseDatabaseRuntimeEnv({ DATABASE_URL: "https://example.com/database" }),
    ).toThrow(/PostgreSQL connection URL/);
  });

  it("accepts an explicit safe demo seed contract", () => {
    expect(
      parseSeedEnv({
        DEMO_ORGANIZATION_NAME: "HireTrack Test",
        DEMO_ADMIN_NAME: "Demo Admin",
        DEMO_ADMIN_EMAIL: "demo@example.com",
        DEMO_ADMIN_PASSWORD: "correct-horse-battery-staple",
      }).DEMO_ADMIN_EMAIL,
    ).toBe("demo@example.com");
  });

  it("rejects the documented demo password placeholder before seeding", () => {
    expect(() =>
      parseSeedEnv({
        DEMO_ORGANIZATION_NAME: "HireTrack Test",
        DEMO_ADMIN_NAME: "Demo Admin",
        DEMO_ADMIN_EMAIL: "demo@example.com",
        DEMO_ADMIN_PASSWORD: "replace-with-a-local-demo-password",
      }),
    ).toThrow(/must not use the documented placeholder/);
  });

  it("accepts a complete optional OAuth provider pair", () => {
    const result = parseServerEnv({
      ...validServerEnv,
      AUTH_GOOGLE_ID: "google-client-id",
      AUTH_GOOGLE_SECRET: "google-client-secret",
    });

    expect(result.AUTH_GOOGLE_ID).toBe("google-client-id");
  });

  it("rejects an incomplete optional OAuth provider pair", () => {
    expect(() =>
      parseServerEnv({ ...validServerEnv, AUTH_GITHUB_ID: "github-client-id" }),
    ).toThrow(/must be configured together/);
  });

  it("rejects demo passwords shorter than the product minimum", () => {
    expect(() =>
      parseSeedEnv({
        DEMO_ORGANIZATION_NAME: "HireTrack Test",
        DEMO_ADMIN_NAME: "Demo Admin",
        DEMO_ADMIN_EMAIL: "demo@example.com",
        DEMO_ADMIN_PASSWORD: "too-short",
      }),
    ).toThrow();
  });

  it("rejects documented secret placeholders in production", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        NODE_ENV: "production",
        AUTH_SECRET: "replace-with-a-unique-secret-of-at-least-32-bytes",
      }),
    ).toThrow(/must not use the documented placeholder/);
  });
});
