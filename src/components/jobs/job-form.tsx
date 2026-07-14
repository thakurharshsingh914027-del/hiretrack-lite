"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type Result = { ok: boolean; message?: string };
type Action = (previous: Result | null, formData: FormData) => Promise<Result>;
export function JobForm({
  action,
  initial,
}: {
  action: Action;
  initial?: Partial<Record<string, string | number>>;
}) {
  const [state, formAction, pending] = useActionState<Result | null, FormData>(
    action,
    null,
  );
  useEffect(() => {
    if (state?.ok) window.location.assign("/app/jobs");
  }, [state]);
  return (
    <form
      action={async (data) => {
        await formAction(data);
      }}
      className="space-y-5"
    >
      {initial?.id ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}
      {initial?.version ? (
        <input type="hidden" name="version" value={initial.version} />
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Title
          <input
            required
            name="title"
            defaultValue={initial?.title}
            maxLength={180}
            className="bg-background h-11 rounded-md border px-3"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Department
          <input
            required
            name="department"
            defaultValue={initial?.department}
            maxLength={120}
            className="bg-background h-11 rounded-md border px-3"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Location
          <input
            required
            name="location"
            defaultValue={initial?.location}
            maxLength={180}
            className="bg-background h-11 rounded-md border px-3"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Employment type
          <select
            name="employmentType"
            defaultValue={initial?.employmentType ?? "FULL_TIME"}
            className="bg-background h-11 rounded-md border px-3"
          >
            <option>FULL_TIME</option>
            <option>PART_TIME</option>
            <option>CONTRACT</option>
            <option>TEMPORARY</option>
            <option>INTERNSHIP</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea
          required
          name="description"
          defaultValue={initial?.description}
          maxLength={10000}
          className="bg-background min-h-36 rounded-md border p-3"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Requirements
        <textarea
          required
          name="requirements"
          defaultValue={initial?.requirements}
          maxLength={10000}
          className="bg-background min-h-36 rounded-md border p-3"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Status
        <select
          name="status"
          defaultValue={initial?.status ?? "DRAFT"}
          className="bg-background h-11 rounded-md border px-3"
        >
          <option>DRAFT</option>
          <option>OPEN</option>
          <option>CLOSED</option>
        </select>
      </label>
      {state && !state.ok ? (
        <p role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : "Save job"}
      </Button>
    </form>
  );
}
