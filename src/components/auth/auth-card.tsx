import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({
  eyebrow = "HireTrack Lite",
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-12"
    >
      <p className="text-primary text-sm font-semibold">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {description}
      </p>
      <section className="border-border bg-card mt-8 rounded-xl border p-6 shadow-sm">
        {children}
      </section>
      {footer && (
        <div className="text-muted-foreground mt-5 text-center text-sm">
          {footer}
        </div>
      )}
      <p className="mt-8 text-center text-xs">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          Back to HireTrack Lite
        </Link>
      </p>
    </main>
  );
}
