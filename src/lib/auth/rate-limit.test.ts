import { describe, expect, it } from "vitest";

import { AuthRateLimiter, MemoryRateLimitBackend } from "@/lib/auth/rate-limit";

describe("auth rate limiting", () => {
  it("allows five attempts, then returns a truthful window retry", async () => {
    const backend = new MemoryRateLimitBackend();
    const limiter = new AuthRateLimiter(backend);
    const key = "test-key";
    const start = 1_700_000_000_000;
    for (let index = 0; index < 5; index += 1) {
      await expect(
        limiter.consume([key], start + index * 60_000),
      ).resolves.toBeDefined();
    }
    await expect(
      limiter.consume([key], start + 5 * 60_000),
    ).rejects.toMatchObject({ retryAfter: 600 });
  });

  it("applies exponential delay and resets on success", async () => {
    const backend = new MemoryRateLimitBackend();
    const first = await backend.consume("key", 1_700_000_000_000);
    expect(first.retryAt).toBe(1_700_000_001_000);
    const second = await backend.consume("key", first.retryAt);
    expect(second.retryAt).toBe(1_700_000_003_000);
    await backend.reset("key");
    await expect(backend.consume("key", first.retryAt)).resolves.toMatchObject({
      count: 1,
    });
  });
});
