import { createHmac } from "node:crypto";

import { Redis } from "@upstash/redis";

import { parseRateLimitEnv } from "@/lib/env";
import { RateLimitError } from "@/lib/auth/errors";

export const AUTH_RATE_LIMIT = {
  limit: 5,
  windowMs: 15 * 60 * 1_000,
  baseBackoffMs: 1_000,
  maxBackoffMs: 60_000,
} as const;

export type RateLimitState = {
  allowed: boolean;
  count: number;
  resetAt: number;
  retryAt: number;
};

export interface RateLimitBackend {
  consume(key: string, now: number): Promise<RateLimitState>;
  peek(key: string, now: number): Promise<RateLimitState>;
  reset(key: string): Promise<void>;
}

type MemoryEntry = { count: number; resetAt: number; retryAt: number };

export class MemoryRateLimitBackend implements RateLimitBackend {
  private readonly entries = new Map<string, MemoryEntry>();

  async consume(key: string, now: number): Promise<RateLimitState> {
    const current = this.entries.get(key);
    const state =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + AUTH_RATE_LIMIT.windowMs, retryAt: 0 }
        : current;

    if (state.retryAt > now) {
      this.entries.set(key, state);
      return { allowed: false, ...state };
    }
    if (state.count >= AUTH_RATE_LIMIT.limit) {
      this.entries.set(key, state);
      return { allowed: false, ...state, retryAt: state.resetAt };
    }

    state.count += 1;
    state.retryAt = Math.min(
      state.resetAt,
      now +
        Math.min(
          AUTH_RATE_LIMIT.maxBackoffMs,
          AUTH_RATE_LIMIT.baseBackoffMs * 2 ** (state.count - 1),
        ),
    );
    this.entries.set(key, state);
    return { allowed: true, ...state };
  }

  async peek(key: string, now: number): Promise<RateLimitState> {
    const current = this.entries.get(key);
    if (!current || current.resetAt <= now) {
      return {
        allowed: true,
        count: 0,
        resetAt: now + AUTH_RATE_LIMIT.windowMs,
        retryAt: 0,
      };
    }
    const blocked =
      current.retryAt > now || current.count >= AUTH_RATE_LIMIT.limit;
    return {
      allowed: !blocked,
      ...current,
      retryAt: blocked
        ? Math.max(
            current.retryAt,
            current.count >= AUTH_RATE_LIMIT.limit ? current.resetAt : 0,
          )
        : current.retryAt,
    };
  }

  async reset(key: string) {
    this.entries.delete(key);
  }
}

const UPSTASH_SCRIPT = `
local count = tonumber(redis.call('HGET', KEYS[1], 'count') or '0')
local resetAt = tonumber(redis.call('HGET', KEYS[1], 'resetAt') or '0')
local retryAt = tonumber(redis.call('HGET', KEYS[1], 'retryAt') or '0')
if resetAt <= tonumber(ARGV[1]) then count = 0; resetAt = tonumber(ARGV[1]) + tonumber(ARGV[2]); retryAt = 0 end
if retryAt > tonumber(ARGV[1]) then return {0, count, resetAt, retryAt} end
if count >= tonumber(ARGV[3]) then return {0, count, resetAt, resetAt} end
count = count + 1
local backoff = math.min(tonumber(ARGV[5]), tonumber(ARGV[4]) * (2 ^ (count - 1)))
retryAt = math.min(resetAt, tonumber(ARGV[1]) + backoff)
redis.call('HSET', KEYS[1], 'count', count, 'resetAt', resetAt, 'retryAt', retryAt)
redis.call('PEXPIREAT', KEYS[1], resetAt + 1000)
return {1, count, resetAt, retryAt}
`;

class UpstashRateLimitBackend implements RateLimitBackend {
  constructor(private readonly redis: Redis) {}

  private async run(key: string, now: number, consume: boolean) {
    if (!consume) {
      const value =
        (await this.redis.hmget<{
          count?: string;
          resetAt?: string;
          retryAt?: string;
        }>(key, "count", "resetAt", "retryAt")) ?? {};
      const count = Number(value.count ?? 0);
      const resetAt = Number(value.resetAt ?? now + AUTH_RATE_LIMIT.windowMs);
      const retryAt = Number(value.retryAt ?? 0);
      const expired = resetAt <= now;
      return {
        allowed: expired || (retryAt <= now && count < AUTH_RATE_LIMIT.limit),
        count: expired ? 0 : count,
        resetAt: expired ? now + AUTH_RATE_LIMIT.windowMs : resetAt,
        retryAt: expired ? 0 : retryAt,
      };
    }
    const result = (await this.redis.eval(
      UPSTASH_SCRIPT,
      [key],
      [
        now,
        AUTH_RATE_LIMIT.windowMs,
        AUTH_RATE_LIMIT.limit,
        AUTH_RATE_LIMIT.baseBackoffMs,
        AUTH_RATE_LIMIT.maxBackoffMs,
      ],
    )) as number[];
    return {
      allowed: Number(result[0]) === 1,
      count: Number(result[1]),
      resetAt: Number(result[2]),
      retryAt: Number(result[3]),
    };
  }
  consume(key: string, now: number) {
    return this.run(key, now, true);
  }
  peek(key: string, now: number) {
    return this.run(key, now, false);
  }
  async reset(key: string) {
    await this.redis.del(key);
  }
}

const globalForRateLimit = globalThis as typeof globalThis & {
  hireTrackRateLimiter?: AuthRateLimiter;
};

export function privacyKey(kind: "ip" | "account", value: string) {
  const secret =
    process.env.AUTH_SECRET ?? "hiretrack-development-rate-limit-key";
  return `hiretrack:auth:${kind}:${createHmac("sha256", secret).update(value).digest("hex")}`;
}

export class AuthRateLimiter {
  constructor(private readonly backend: RateLimitBackend) {}

  async check(keys: string[], now = Date.now()) {
    const states = await Promise.all(
      keys.map((key) => this.backend.peek(key, now)),
    );
    const blocked = states.find((state) => !state.allowed);
    if (blocked) {
      throw new RateLimitError(Math.max(1, blocked.retryAt - now) / 1_000);
    }
    return states;
  }

  async consume(keys: string[], now = Date.now()) {
    const states = await Promise.all(
      keys.map((key) => this.backend.consume(key, now)),
    );
    const blocked = states.find((state) => !state.allowed);
    if (blocked) {
      throw new RateLimitError(Math.max(1, blocked.retryAt - now) / 1_000);
    }
    return states;
  }

  async reset(keys: string[]) {
    await Promise.all(keys.map((key) => this.backend.reset(key)));
  }
}

export function getAuthRateLimiter() {
  if (globalForRateLimit.hireTrackRateLimiter)
    return globalForRateLimit.hireTrackRateLimiter;
  const env = parseRateLimitEnv(process.env);
  const production =
    env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  const backend =
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? new UpstashRateLimitBackend(
          new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
          }),
        )
      : production
        ? (() => {
            throw new Error("Production rate limiting requires Upstash Redis");
          })()
        : new MemoryRateLimitBackend();
  globalForRateLimit.hireTrackRateLimiter = new AuthRateLimiter(backend);
  return globalForRateLimit.hireTrackRateLimiter;
}

export function getRequestIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export function authRateLimitKeys(ip: string, email: string) {
  return [privacyKey("ip", ip), privacyKey("account", email)];
}
