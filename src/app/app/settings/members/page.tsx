import { UserPlusIcon } from "lucide-react";
import { auth } from "../../../../../auth";
import { getDatabase } from "@/lib/db";
import { resolveAccessContext } from "@/lib/auth/session";
import { inviteMemberAction } from "@/lib/auth/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Members",
  robots: { index: false, follow: false },
};
export default async function MembersPage() {
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
  const members = await getDatabase().membership.findMany({
    where: { organizationId: context.organization.id, deactivatedAt: null },
    include: {
      user: { select: { name: true, email: true, emailVerified: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const invitations =
    context.membership.role === "ADMIN"
      ? await getDatabase().organizationInvitation.findMany({
          where: {
            organizationId: context.organization.id,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          select: { id: true, email: true, role: true, expiresAt: true },
          orderBy: { createdAt: "desc" },
        })
      : [];
  async function inviteAction(formData: FormData) {
    "use server";
    await inviteMemberAction(formData);
  }
  return (
    <main id="main-content">
      <p className="text-primary text-sm font-semibold">Settings</p>
      <h1 className="mt-1 text-3xl font-semibold">Members</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        People with access to {context.organization.name}.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Active members</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="border-border flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {member.user.name || member.user.email}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {member.user.email}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs font-semibold">
                  {member.role}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        {context.membership.role === "ADMIN" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlusIcon className="size-4" />
                Invite member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={inviteAction} className="grid gap-3">
                <input
                  name="email"
                  type="email"
                  placeholder="teammate@example.com"
                  required
                  className="border-input h-10 rounded-md border px-3 text-sm"
                />
                <select
                  name="role"
                  defaultValue="RECRUITER"
                  className="border-input h-10 rounded-md border px-3 text-sm"
                >
                  <option value="RECRUITER">Recruiter</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <button className="bg-primary text-primary-foreground h-10 rounded-md text-sm font-semibold">
                  Send invitation
                </button>
              </form>
              <div className="mt-6 grid gap-2">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="text-muted-foreground text-xs"
                  >
                    Pending: {invitation.email} · {invitation.role}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
