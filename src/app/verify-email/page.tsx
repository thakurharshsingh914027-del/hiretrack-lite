import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { EmailRequestForm, VerifyForm } from "@/components/auth/auth-forms";
import {
  resendVerificationFormAction,
  verifyEmailFormAction,
} from "@/lib/auth/actions";
export const metadata = {
  title: "Verify email",
  robots: { index: false, follow: false },
};
export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Verify your email"
      description="Use the secure link from your inbox. Links are single-use and expire automatically."
      footer={
        <>
          <Link className="text-primary font-semibold" href="/login">
            Sign in
          </Link>
          <span className="mx-1">·</span>
          <Link className="text-primary font-semibold" href="/signup">
            Start over
          </Link>
        </>
      }
    >
      <VerifyForm action={verifyEmailFormAction} />
      <div className="mt-6 border-t pt-5">
        <p className="text-muted-foreground mb-3 text-sm">Need another link?</p>
        <EmailRequestForm
          action={resendVerificationFormAction}
          button="Resend verification"
        />
      </div>
    </AuthCard>
  );
}
