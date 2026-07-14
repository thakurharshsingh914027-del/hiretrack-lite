"use client";
import { signOutAction } from "@/lib/auth/actions";
export function UserMenu({
  name,
  organization,
}: {
  name: string;
  organization: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-foreground text-xs font-semibold">{name}</p>
        <p className="text-muted-foreground text-[11px]">{organization}</p>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="border-border hover:bg-muted min-h-10 rounded-md border px-3 text-xs font-semibold"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
