import { SettingsIcon } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Profile settings",
  description: "Manage your HireTrack Lite profile and workspace preferences.",
  path: "/app/settings/profile",
  noIndex: true,
});

export default function ProfileSettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Settings"
      title="Profile settings"
      description="Your profile and workspace preferences will be managed from this view."
      emptyTitle="Profile settings are not connected yet"
      emptyDescription="Secure profile editing arrives with the authentication milestone."
      icon={<SettingsIcon className="size-5" aria-hidden="true" />}
      docsHref="/docs/getting-started"
    />
  );
}
