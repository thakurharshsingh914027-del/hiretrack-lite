"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { acceptInvitationAction } from "@/lib/auth/actions";
export default function AcceptInvitePage() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (value) {
      setToken(value);
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  async function submit(formData: FormData) {
    const result = await acceptInvitationAction(formData);
    setMessage(
      result.ok
        ? "Invitation accepted. Open your workspace to continue."
        : result.message,
    );
  }
  return (
    <AuthCard
      title="Join a workspace"
      description="Sign in with the invited email, then prove control of it to accept this invitation."
      footer={
        <>
          <Link className="text-primary font-semibold" href="/login">
            Sign in
          </Link>
          <span className="mx-1">·</span>
          <Link className="text-primary font-semibold" href="/signup">
            Create account
          </Link>
        </>
      }
    >
      <form action={submit} className="grid gap-4">
        <input type="hidden" name="token" value={token} />
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <button
          disabled={!token}
          className="bg-primary text-primary-foreground h-11 rounded-md font-semibold disabled:opacity-60"
        >
          Accept invitation
        </button>
      </form>
    </AuthCard>
  );
}
