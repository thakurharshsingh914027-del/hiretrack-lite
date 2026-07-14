import type { Adapter, AdapterAccount, AdapterUser } from "@auth/core/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";

import type { PrismaClient } from "@/generated/prisma/client";
import { normalizeEmail } from "@/lib/auth/validation";

function normalizeAdapterUser(user: AdapterUser): AdapterUser {
  const email = normalizeEmail(user.email);
  return { ...user, email };
}

function stripProviderSecrets(account: AdapterAccount) {
  return {
    userId: account.userId,
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
  };
}

/**
 * PrismaAdapter is wrapped because this application requires a normalized
 * email column and deliberately does not persist OAuth bearer tokens.
 */
export function createAuthAdapter(database: PrismaClient): Adapter {
  const base = PrismaAdapter(database as never) as Adapter;
  return {
    ...base,
    async createUser(user) {
      const normalized = normalizeAdapterUser(user);
      const data = {
        id: normalized.id,
        email: normalized.email,
        emailNormalized: normalized.email,
        emailVerified: normalized.emailVerified,
        ...(normalized.name !== undefined ? { name: normalized.name } : {}),
        ...(normalized.image !== undefined ? { image: normalized.image } : {}),
      };
      const created = await database.user.create({ data });
      return created as unknown as AdapterUser;
    },
    async getUserByEmail(email) {
      const user = await database.user.findUnique({
        where: { emailNormalized: normalizeEmail(email) },
      });
      return (user as unknown as AdapterUser | null) ?? null;
    },
    async updateUser(user) {
      const data: Record<string, unknown> = { ...user };
      delete data.id;
      if (typeof data.email === "string") {
        const email = normalizeEmail(data.email);
        data.email = email;
        data.emailNormalized = email;
      }
      const updated = await database.user.update({
        where: { id: user.id },
        data,
      });
      return updated as unknown as AdapterUser;
    },
    async linkAccount(account) {
      await database.account.create({ data: stripProviderSecrets(account) });
      return null;
    },
  };
}
