import { createMetadata } from "@/lib/site";
import { auth } from "../../../../../auth";
import { getDatabase } from "@/lib/db";
import { resolveAccessContext } from "@/lib/auth/session";

export const metadata = createMetadata({
  title: "Profile settings",
  description: "Manage your HireTrack Lite profile and workspace preferences.",
  path: "/app/settings/profile",
  noIndex: true,
});

export default async function ProfileSettingsPage() {
  const session = await auth();
  const context = session?.user.id
    ? await resolveAccessContext(getDatabase(), {
        userId: session.user.id,
        sessionVersion: session.sessionVersion,
        ...(session.selectedOrganizationId
          ? { selectedOrganizationId: session.selectedOrganizationId }
          : {}),
      })
    : null;
  if (!context) return null;
  return (
    <main id="main-content">
      <p className="text-primary text-sm font-semibold">Settings</p>
      <h1 className="mt-1 text-3xl font-semibold">Profile settings</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Your identity and current workspace context.
      </p>
      <div className="border-border bg-card mt-8 grid gap-4 rounded-xl border p-6">
        <div>
          <p className="text-muted-foreground text-xs uppercase">Name</p>
          <p className="mt-1 font-medium">{context.user.name || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Email</p>
          <p className="mt-1 font-medium">{context.user.email}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Workspace</p>
          <p className="mt-1 font-medium">{context.organization.name}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase">Role</p>
          <p className="mt-1 font-medium">{context.membership.role}</p>
        </div>
      </div>
    </main>
  );
}
