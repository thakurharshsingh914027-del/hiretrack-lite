import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";
import { configuredOAuthProviders } from "../../../auth";
import {
  loginFormAction,
  oauthGithubFormAction,
  oauthGoogleFormAction,
} from "@/lib/auth/actions";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue to your recruiting workspace."
      footer={
        <>
          <span>New here? </span>
          <Link className="text-primary font-semibold" href="/signup">
            Create an account
          </Link>
          <span className="mx-1">·</span>
          <Link className="text-primary font-semibold" href="/forgot-password">
            Forgot password?
          </Link>
        </>
      }
    >
      <LoginForm
        {...(params.callbackUrl ? { callbackUrl: params.callbackUrl } : {})}
        oauthGoogle={configuredOAuthProviders.google}
        oauthGithub={configuredOAuthProviders.github}
        action={loginFormAction}
        googleAction={oauthGoogleFormAction}
        githubAction={oauthGithubFormAction}
      />
    </AuthCard>
  );
}
