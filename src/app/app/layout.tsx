import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { createMetadata } from "@/lib/site";

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
  return <AppShell>{children}</AppShell>;
}
