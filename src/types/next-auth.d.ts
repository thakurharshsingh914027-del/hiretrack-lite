import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
    sessionVersion: number;
    selectedOrganizationId?: string;
  }

  interface User {
    sessionVersion?: number;
    selectedOrganizationId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    sessionVersion?: number;
    selectedOrganizationId?: string;
  }
}
