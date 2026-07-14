import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
export const metadata = {
  title: "Demo access",
  robots: { index: false, follow: false },
};
export default function DemoPage() {
  return (
    <AuthCard
      title="HireTrack Lite demo"
      description="Use the deployment's server-configured demo account to explore the verified workspace."
      footer={
        <Link className="text-primary font-semibold" href="/login">
          Go to sign in
        </Link>
      }
    >
      <p className="text-muted-foreground text-sm leading-6">
        Demo credentials are intentionally never embedded in source code or
        public pages. An operator can provide them through server-only
        environment configuration.
      </p>
    </AuthCard>
  );
}
