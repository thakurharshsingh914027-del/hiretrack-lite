import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { EmailRequestForm } from "@/components/auth/auth-forms";
import { requestPasswordResetFormAction } from "@/lib/auth/actions";
export const metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we will send a secure one-time link if an eligible account exists."
      footer={
        <Link className="text-primary font-semibold" href="/login">
          Back to sign in
        </Link>
      }
    >
      <EmailRequestForm
        action={requestPasswordResetFormAction}
        button="Send reset link"
      />
    </AuthCard>
  );
}
