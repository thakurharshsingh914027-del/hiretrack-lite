"use client";
import { useActionState, useEffect } from "react";
import { completeOAuthOnboardingAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/auth/errors";
const initial: ActionResult<unknown> = { ok: true, data: null };
export function OnboardingForm() {
  const [state, action, pending] = useActionState(
    async (_state: ActionResult<unknown>, fd: FormData) =>
      completeOAuthOnboardingAction(fd),
    initial,
  );
  useEffect(() => {
    if (state.ok && state.data) window.location.assign("/app");
  }, [state]);
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium">
        Organization name
        <input
          name="organizationName"
          required
          className="border-input bg-background h-11 rounded-md border px-3"
        />
      </label>
      {!state.ok && (
        <p role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      )}
      <button
        disabled={pending}
        className="bg-primary text-primary-foreground h-11 rounded-md font-semibold"
      >
        {pending ? "Creating…" : "Create workspace"}
      </button>
    </form>
  );
}
