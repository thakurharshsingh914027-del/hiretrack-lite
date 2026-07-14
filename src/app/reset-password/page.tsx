import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { TokenForm } from "@/components/auth/auth-forms";
import { resetPasswordFormAction } from "@/lib/auth/actions";
export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      description="Your reset link is single-use. Choose a strong password with at least 12 characters."
      footer={
        <Link className="text-primary font-semibold" href="/login">
          Back to sign in
        </Link>
      }
    >
      <TokenForm
        action={resetPasswordFormAction}
        confirm
        button="Update password"
      />
    </AuthCard>
  );
}
