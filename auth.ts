import "server-only";

import NextAuth from "next-auth";
import type { Account, Profile } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { getDatabase } from "@/lib/db";
import { createAuthAdapter } from "@/lib/auth/adapter";
import { GENERIC_CREDENTIALS_MESSAGE } from "@/lib/auth/errors";
import {
  getAuthRateLimiter,
  authRateLimitKeys,
  getRequestIp,
} from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/validation";

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production";
const secret =
  process.env.AUTH_SECRET ??
  (isProduction ? "" : "hiretrack-local-development-secret-change-me-please");

function providerPair(
  id: string | undefined,
  secretValue: string | undefined,
): [string, string] | null {
  return id && secretValue ? [id, secretValue] : null;
}

const google = providerPair(
  process.env.AUTH_GOOGLE_ID,
  process.env.AUTH_GOOGLE_SECRET,
);
const github = providerPair(
  process.env.AUTH_GITHUB_ID,
  process.env.AUTH_GITHUB_SECRET,
);

async function githubEmailIsVerified(account: Account | null, email: string) {
  if (!account?.access_token) return false;
  try {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${account.access_token}`,
        "User-Agent": "HireTrack-Lite",
      },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return false;
    const entries = (await response.json()) as Array<{
      email?: string;
      verified?: boolean;
      primary?: boolean;
    }>;
    const wanted = normalizeEmail(email);
    return entries.some(
      (entry) =>
        entry.primary === true &&
        entry.verified === true &&
        normalizeEmail(entry.email ?? "") === wanted,
    );
  } catch {
    return false;
  }
}

const providers = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      const email = normalizeEmail(String(credentials?.email ?? ""));
      const password = String(credentials?.password ?? "");
      const database = getDatabase();
      const limiter = getAuthRateLimiter();
      const keys = authRateLimitKeys(
        getRequestIp(request.headers),
        email || "unknown",
      );
      try {
        await limiter.consume(keys);
      } catch {
        return null;
      }

      const user = email
        ? await database.user.findUnique({ where: { emailNormalized: email } })
        : null;
      const passwordMatches = await verifyPassword(
        user?.passwordHash,
        password,
      );
      if (!user || !passwordMatches || user.disabledAt || !user.emailVerified)
        return null;
      await limiter.reset(keys);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        sessionVersion: user.sessionVersion,
      };
    },
  }),
  ...(google ? [Google({ clientId: google[0], clientSecret: google[1] })] : []),
  ...(github
    ? [
        GitHub({
          clientId: github[0],
          clientSecret: github[1],
          authorization: { params: { scope: "read:user user:email" } },
        }),
      ]
    : []),
];

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret,
  adapter: createAuthAdapter(getDatabase()),
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60, updateAge: 60 * 60 },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: `${isProduction ? "__Host-" : ""}hiretrack.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.type === "credentials") return true;
      const email = normalizeEmail(user.email ?? "");
      if (!email) return false;
      if (
        account.provider === "google" &&
        (profile as Profile | undefined)?.email_verified !== true
      )
        return false;
      if (
        account.provider === "github" &&
        !(await githubEmailIsVerified(account, email))
      )
        return false;
      const database = getDatabase();
      const existing = await database.user.findUnique({
        where: { emailNormalized: email },
        select: { id: true, passwordHash: true },
      });
      if (existing?.passwordHash && existing.id !== user.id) return false;
      if (user.id)
        await database.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date(), email, emailNormalized: email },
        });
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        const database = getDatabase();
        const current = await database.user.findUnique({
          where: { id: user.id },
          select: {
            sessionVersion: true,
            memberships: {
              where: { deactivatedAt: null },
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { organizationId: true },
            },
          },
        });
        token.userId = user.id;
        token.sessionVersion =
          current?.sessionVersion ?? user.sessionVersion ?? 0;
        token.selectedOrganizationId = current?.memberships[0]?.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.userId === "string") session.user.id = token.userId;
      session.sessionVersion =
        typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
      if (typeof token.selectedOrganizationId === "string")
        session.selectedOrganizationId = token.selectedOrganizationId;
      return session;
    },
  },
  trustHost: true,
});

export const configuredOAuthProviders = {
  google: Boolean(google),
  github: Boolean(github),
} as const;
export { GENERIC_CREDENTIALS_MESSAGE };
