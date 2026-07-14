import Link from "next/link";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

const docLinks = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/getting-started", label: "Getting started" },
  { href: "/docs/features", label: "Features" },
  { href: "/docs/architecture", label: "Architecture" },
  { href: "/docs/deployment", label: "Deployment" },
  { href: "/faq", label: "FAQ" },
] as const;

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pt-12">
        <aside className="hidden lg:block">
          <nav
            className="sticky top-28 grid gap-1"
            aria-label="Documentation navigation"
          >
            <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-[0.12em] uppercase">
              Guides
            </p>
            {docLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex min-h-11 items-center rounded-md px-3 text-sm focus-visible:ring-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <nav
          className="border-border bg-card mb-8 grid grid-cols-2 gap-2 rounded-xl border p-2 text-sm lg:hidden"
          aria-label="Documentation navigation"
        >
          {docLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex min-h-11 items-center rounded-md px-3 focus-visible:ring-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
      <SiteFooter />
    </>
  );
}
