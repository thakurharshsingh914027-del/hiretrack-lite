import { z } from "zod";

const httpUrl = z.url().refine(
  (value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  },
  { message: "Must use an HTTP or HTTPS URL" },
);

export const publicEnvSchema = z
  .object({
    NEXT_PUBLIC_APP_URL: httpUrl.optional(),
    NEXT_PUBLIC_REPOSITORY_URL: z.union([httpUrl, z.literal("")]).optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().trim().min(1).optional(),
  })
  .transform((value, context) => {
    const candidateUrl =
      value.NEXT_PUBLIC_APP_URL ??
      (value.VERCEL_PROJECT_PRODUCTION_URL
        ? "https://" + value.VERCEL_PROJECT_PRODUCTION_URL
        : "http://localhost:3000");
    const parsedUrl = httpUrl.safeParse(candidateUrl);

    if (!parsedUrl.success) {
      context.addIssue({
        code: "custom",
        message: "Unable to resolve a valid canonical application URL",
        path: ["NEXT_PUBLIC_APP_URL"],
      });
      return z.NEVER;
    }

    const hostname = new URL(parsedUrl.data).hostname;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]";

    if (value.VERCEL_ENV === "production" && isLocal) {
      context.addIssue({
        code: "custom",
        message:
          "Production metadata requires NEXT_PUBLIC_APP_URL or VERCEL_PROJECT_PRODUCTION_URL",
        path: ["NEXT_PUBLIC_APP_URL"],
      });
      return z.NEVER;
    }

    return {
      NEXT_PUBLIC_APP_URL: parsedUrl.data,
      NEXT_PUBLIC_REPOSITORY_URL: value.NEXT_PUBLIC_REPOSITORY_URL,
    };
  });

const optionalCredential = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const postgresUrl = z
  .string()
  .min(1)
  .refine(
    (value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "postgres:" || protocol === "postgresql:";
      } catch {
        return false;
      }
    },
    { message: "Must be a PostgreSQL connection URL" },
  );

export const databaseRuntimeEnvSchema = z.object({
  DATABASE_URL: postgresUrl,
});

export const databaseEnvSchema = databaseRuntimeEnvSchema.extend({
  DIRECT_URL: postgresUrl,
});

export const seedEnvSchema = z
  .object({
    DEMO_ORGANIZATION_NAME: z.string().trim().min(1).max(120),
    DEMO_ADMIN_NAME: z.string().trim().min(1).max(120),
    DEMO_ADMIN_EMAIL: z.email(),
    DEMO_ADMIN_PASSWORD: z.string().min(12).max(1024),
  })
  .superRefine((value, context) => {
    if (/replace[-_ ]?with|change[-_ ]?me/i.test(value.DEMO_ADMIN_PASSWORD)) {
      context.addIssue({
        code: "custom",
        message: "DEMO_ADMIN_PASSWORD must not use the documented placeholder",
        path: ["DEMO_ADMIN_PASSWORD"],
      });
    }
  });

export const serverEnvSchema = z
  .object({
    ...databaseRuntimeEnvSchema.shape,
    AUTH_SECRET: z
      .string()
      .min(43, "AUTH_SECRET must contain at least 32 bytes of encoded entropy")
      .regex(/^\S+$/, "AUTH_SECRET cannot contain whitespace"),
    AUTH_URL: z.url(),
    AUTH_GOOGLE_ID: optionalCredential,
    AUTH_GOOGLE_SECRET: optionalCredential,
    AUTH_GITHUB_ID: optionalCredential,
    AUTH_GITHUB_SECRET: optionalCredential,
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.email(),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  })
  .superRefine((value, context) => {
    const pairs = [
      [
        "AUTH_GOOGLE_ID",
        value.AUTH_GOOGLE_ID,
        "AUTH_GOOGLE_SECRET",
        value.AUTH_GOOGLE_SECRET,
      ],
      [
        "AUTH_GITHUB_ID",
        value.AUTH_GITHUB_ID,
        "AUTH_GITHUB_SECRET",
        value.AUTH_GITHUB_SECRET,
      ],
    ] as const;

    for (const [idKey, id, secretKey, secret] of pairs) {
      if (Boolean(id) !== Boolean(secret)) {
        context.addIssue({
          code: "custom",
          message: `${idKey} and ${secretKey} must be configured together`,
          path: [id ? secretKey : idKey],
        });
      }
    }

    const isProduction =
      value.NODE_ENV === "production" || value.VERCEL_ENV === "production";

    if (isProduction) {
      const productionSecrets = [
        ["AUTH_SECRET", value.AUTH_SECRET],
        ["RESEND_API_KEY", value.RESEND_API_KEY],
        ["BLOB_READ_WRITE_TOKEN", value.BLOB_READ_WRITE_TOKEN],
        ["UPSTASH_REDIS_REST_URL", value.UPSTASH_REDIS_REST_URL],
        ["UPSTASH_REDIS_REST_TOKEN", value.UPSTASH_REDIS_REST_TOKEN],
      ] as const;

      for (const [key, secret] of productionSecrets) {
        if (/replace[-_ ]?with|change[-_ ]?me/i.test(secret)) {
          context.addIssue({
            code: "custom",
            message:
              key + " must not use the documented placeholder in production",
            path: [key],
          });
        }
      }
    }
  });

/** Environment required by the authentication boundary only. Storage and
 * candidate-mail dependencies intentionally stay in their own contracts so a
 * M3 deployment can build without future M5 credentials. */
export const authEnvSchema = z
  .object({
    DATABASE_URL: postgresUrl,
    AUTH_SECRET: z
      .string()
      .min(43, "AUTH_SECRET must contain at least 32 bytes of encoded entropy")
      .regex(/^\S+$/, "AUTH_SECRET cannot contain whitespace"),
    AUTH_URL: z.url(),
    AUTH_GOOGLE_ID: optionalCredential,
    AUTH_GOOGLE_SECRET: optionalCredential,
    AUTH_GITHUB_ID: optionalCredential,
    AUTH_GITHUB_SECRET: optionalCredential,
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  })
  .superRefine((value, context) => {
    for (const [idKey, id, secretKey, secret] of [
      [
        "AUTH_GOOGLE_ID",
        value.AUTH_GOOGLE_ID,
        "AUTH_GOOGLE_SECRET",
        value.AUTH_GOOGLE_SECRET,
      ],
      [
        "AUTH_GITHUB_ID",
        value.AUTH_GITHUB_ID,
        "AUTH_GITHUB_SECRET",
        value.AUTH_GITHUB_SECRET,
      ],
    ] as const) {
      if (Boolean(id) !== Boolean(secret)) {
        context.addIssue({
          code: "custom",
          message: `${idKey} and ${secretKey} must be configured together`,
          path: [id ? secretKey : idKey],
        });
      }
    }

    const production =
      value.NODE_ENV === "production" || value.VERCEL_ENV === "production";
    if (
      production &&
      /replace[-_ ]?with|change[-_ ]?me/i.test(value.AUTH_SECRET)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "AUTH_SECRET must not use the documented placeholder in production",
        path: ["AUTH_SECRET"],
      });
    }
  });

export const mailEnvSchema = z
  .object({
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.email(),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.NODE_ENV === "production" || value.VERCEL_ENV === "production") &&
      /replace[-_ ]?with|change[-_ ]?me/i.test(value.RESEND_API_KEY)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "RESEND_API_KEY must not use the documented placeholder in production",
        path: ["RESEND_API_KEY"],
      });
    }
  });

export const rateLimitEnvSchema = z
  .object({
    AUTH_SECRET: z.string().min(43),
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  })
  .superRefine((value, context) => {
    if (
      Boolean(value.UPSTASH_REDIS_REST_URL) !==
      Boolean(value.UPSTASH_REDIS_REST_TOKEN)
    ) {
      context.addIssue({
        code: "custom",
        message: "Upstash URL and token must be configured together",
        path: ["UPSTASH_REDIS_REST_URL"],
      });
    }
    if (
      (value.NODE_ENV === "production" || value.VERCEL_ENV === "production") &&
      !value.UPSTASH_REDIS_REST_URL
    ) {
      context.addIssue({
        code: "custom",
        message: "Production requires Upstash rate limiting",
        path: ["UPSTASH_REDIS_REST_URL"],
      });
    }
  });

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;
export type MailEnv = z.infer<typeof mailEnvSchema>;
export type RateLimitEnv = z.infer<typeof rateLimitEnvSchema>;
export type DatabaseRuntimeEnv = z.infer<typeof databaseRuntimeEnvSchema>;
export type SeedEnv = z.infer<typeof seedEnvSchema>;

export function parsePublicEnv(
  input: Record<string, string | undefined>,
): PublicEnv {
  return publicEnvSchema.parse(input);
}

export function parseServerEnv(
  input: Record<string, string | undefined>,
): ServerEnv {
  return serverEnvSchema.parse(input);
}

export function parseAuthEnv(
  input: Record<string, string | undefined>,
): AuthEnv {
  return authEnvSchema.parse(input);
}

export function parseMailEnv(
  input: Record<string, string | undefined>,
): MailEnv {
  return mailEnvSchema.parse(input);
}

export function parseRateLimitEnv(
  input: Record<string, string | undefined>,
): RateLimitEnv {
  return rateLimitEnvSchema.parse(input);
}

export function parseDatabaseRuntimeEnv(
  input: Record<string, string | undefined>,
): DatabaseRuntimeEnv {
  return databaseRuntimeEnvSchema.parse(input);
}

export function parseSeedEnv(
  input: Record<string, string | undefined>,
): SeedEnv {
  return seedEnvSchema.parse(input);
}
