import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/auth-forms";
import { signUpFormAction } from "@/lib/auth/actions";
export const metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};
export default function SignupPage() {
  return (
    <AuthCard
      title="Create your workspace"
      description="Start with a verified account and a private organization."
      footer={
        <>
          <span>Already have an account? </span>
          <Link className="text-primary font-semibold" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm action={signUpFormAction} />
    </AuthCard>
  );
}
