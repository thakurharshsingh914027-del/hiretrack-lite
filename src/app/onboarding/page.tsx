import { AuthCard } from "@/components/auth/auth-card";
import { OnboardingForm } from "@/components/auth/onboarding-form";
export const metadata = {
  title: "Workspace onboarding",
  robots: { index: false, follow: false },
};
export default function OnboardingPage() {
  return (
    <AuthCard
      title="Create your workspace"
      description="Your account is ready. Choose the organization you want to work in."
    >
      <OnboardingForm />
    </AuthCard>
  );
}
