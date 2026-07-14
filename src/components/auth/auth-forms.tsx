"use client";
/* Token fragments are intentionally copied into an action form and scrubbed
 * from the address bar; this synchronous effect is the boundary between the
 * browser fragment and the server action payload. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useActionState, useEffect, useState } from "react";

import type { ActionResult } from "@/lib/auth/errors";

const initialState: ActionResult<unknown> = { ok: true, data: null };

export type AuthFormAction = (
  previous: ActionResult<unknown>,
  formData: FormData,
) => Promise<ActionResult<unknown>>;

function FormFeedback({ state }: { state: ActionResult<unknown> }) {
  if (state.ok) return null;
  return (
    <p role="alert" className="text-destructive text-sm">
      {state.message}
      {state.retryAfter ? ` Try again in ${state.retryAfter}s.` : ""}
    </p>
  );
}

export function LoginForm({
  callbackUrl = "/app",
  oauthGoogle,
  oauthGithub,
  action,
  googleAction,
  githubAction,
}: {
  callbackUrl?: string;
  oauthGoogle: boolean;
  oauthGithub: boolean;
  action: AuthFormAction;
  googleAction: AuthFormAction;
  githubAction: AuthFormAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  useEffect(() => {
    if (
      state.ok &&
      state.data &&
      typeof state.data === "object" &&
      "redirectTo" in state.data
    )
      window.location.assign(String(state.data.redirectTo));
  }, [state]);
  return (
    <div className="grid gap-5">
      <form
        action={formAction as unknown as (formData: FormData) => Promise<void>}
        className="grid gap-4"
        noValidate
      >
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="border-input bg-background h-11 rounded-md border px-3"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="border-input bg-background h-11 rounded-md border px-3"
          />
        </label>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <FormFeedback state={state} />
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground h-11 rounded-md font-semibold disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {(oauthGoogle || oauthGithub) && (
        <div className="grid gap-2 border-t pt-5">
          {oauthGoogle && (
            <form
              action={
                googleAction as unknown as (formData: FormData) => Promise<void>
              }
            >
              <button
                className="border-input h-11 w-full rounded-md border font-medium"
                type="submit"
              >
                Continue with Google
              </button>
            </form>
          )}
          {oauthGithub && (
            <form
              action={
                githubAction as unknown as (formData: FormData) => Promise<void>
              }
            >
              <button
                className="border-input h-11 w-full rounded-md border font-medium"
                type="submit"
              >
                Continue with GitHub
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function SignUpForm({ action }: { action: AuthFormAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const done = state.ok && state.data !== null;
  if (done)
    return (
      <div className="bg-muted rounded-md p-4 text-sm">
        Account created. Check your email to verify it before signing in.
      </div>
    );
  return (
    <form
      action={formAction as unknown as (formData: FormData) => Promise<void>}
      className="grid gap-4"
      noValidate
    >
      <label className="grid gap-2 text-sm font-medium">
        Name
        <input
          name="name"
          autoComplete="name"
          required
          className="border-input bg-background h-11 rounded-md border px-3"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="border-input bg-background h-11 rounded-md border px-3"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Organization
        <input
          name="organizationName"
          autoComplete="organization"
          required
          className="border-input bg-background h-11 rounded-md border px-3"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="border-input bg-background h-11 rounded-md border px-3"
        />
        <span className="text-muted-foreground text-xs">
          At least 12 characters.
        </span>
      </label>
      <FormFeedback state={state} />
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground h-11 rounded-md font-semibold disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function EmailRequestForm({
  action,
  button = "Send email",
}: {
  action: AuthFormAction;
  button?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const done = state.ok && state.data !== null;
  return done ? (
    <div className="bg-muted rounded-md p-4 text-sm">
      If an eligible account exists, an email will arrive shortly.
    </div>
  ) : (
    <form
      action={formAction as unknown as (formData: FormData) => Promise<void>}
      className="grid gap-4"
    >
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="border-input bg-background h-11 rounded-md border px-3"
        />
      </label>
      <FormFeedback state={state} />
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground h-11 rounded-md font-semibold disabled:opacity-60"
      >
        {pending ? "Sending…" : button}
      </button>
    </form>
  );
}

export function TokenForm({
  action,
  confirm = false,
  button = "Continue",
}: {
  action: AuthFormAction;
  confirm?: boolean;
  button?: string;
}) {
  const [token, setToken] = useState("");
  const [state, formAction, pending] = useActionState(action, initialState);
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (value) {
      setToken(value);
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  return (
    <form
      action={formAction as unknown as (formData: FormData) => Promise<void>}
      className="grid gap-4"
    >
      <input type="hidden" name="token" value={token} />
      <label className="grid gap-2 text-sm font-medium">
        New password
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className="border-input bg-background h-11 rounded-md border px-3"
        />
      </label>
      {confirm && (
        <label className="grid gap-2 text-sm font-medium">
          Confirm password
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            className="border-input bg-background h-11 rounded-md border px-3"
          />
        </label>
      )}
      <FormFeedback state={state} />
      <button
        type="submit"
        disabled={pending || !token}
        className="bg-primary text-primary-foreground h-11 rounded-md font-semibold disabled:opacity-60"
      >
        {pending ? "Working…" : button}
      </button>
    </form>
  );
}

export function VerifyForm({ action }: { action: AuthFormAction }) {
  const [token, setToken] = useState("");
  const [state, formAction, pending] = useActionState(action, initialState);
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (value) {
      setToken(value);
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  return (
    <form
      action={formAction as unknown as (formData: FormData) => Promise<void>}
      className="grid gap-4"
    >
      <input type="hidden" name="token" value={token} />
      <FormFeedback state={state} />
      {state.ok && state.data ? (
        <p className="text-sm">Email verified. You can now sign in.</p>
      ) : (
        <button
          type="submit"
          disabled={pending || !token}
          className="bg-primary text-primary-foreground h-11 rounded-md font-semibold disabled:opacity-60"
        >
          {pending ? "Verifying…" : "Verify email"}
        </button>
      )}
    </form>
  );
}
