import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { createMetadata } from "@/lib/site";
import { auth } from "../../../auth";
import { getDatabase } from "@/lib/db";
import { resolveAccessContext } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = createMetadata({
  title: "Recruiting workspace",
  description: "Manage jobs, candidates, interviews, and hiring decisions.",
  path: "/app",
  noIndex: true,
});

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>;
}

async function ProtectedWorkspace({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user.id) redirect("/login?callbackUrl=/app");
  const context = await resolveAccessContext(getDatabase(), {
    userId: session.user.id,
    sessionVersion: session.sessionVersion,
    ...(session.selectedOrganizationId
      ? { selectedOrganizationId: session.selectedOrganizationId }
      : {}),
  });
  if (!context) redirect("/onboarding");
  if (!context.emailVerified) redirect("/verify-email");
  return (
    <AppShell
      userName={context.user.name ?? context.user.email}
      organizationName={context.organization.name}
    >
      {children}
    </AppShell>
  );
}
