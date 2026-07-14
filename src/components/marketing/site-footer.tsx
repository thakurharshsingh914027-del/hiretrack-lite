import Link from "next/link";

import { Brand } from "@/components/brand";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-border bg-card border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Brand />
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            A focused applicant tracking workspace for small recruiting teams.
          </p>
        </div>
        <nav aria-label="Product links">
          <p className="text-sm font-semibold">Product</p>
          <ul className="text-muted-foreground mt-3 grid gap-1 text-sm">
            <li>
              <Link
                className="hover:text-foreground inline-flex min-h-11 items-center"
                href="/docs/features"
              >
                Features
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-foreground inline-flex min-h-11 items-center"
                href="/docs/getting-started"
              >
                Getting started
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-foreground inline-flex min-h-11 items-center"
                href="/docs/deployment"
              >
                Deployment
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Project links">
          <p className="text-sm font-semibold">Project</p>
          <ul className="text-muted-foreground mt-3 grid gap-1 text-sm">
            <li>
              <Link
                className="hover:text-foreground inline-flex min-h-11 items-center"
                href="/docs"
              >
                Documentation
              </Link>
            </li>
            {siteConfig.repositoryUrl ? (
              <li>
                <a
                  className="hover:text-foreground inline-flex min-h-11 items-center"
                  href={siteConfig.repositoryUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Source code
                </a>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
      <div className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 HireTrack Lite contributors. MIT licensed.</p>
          <p>Built for the Digital Heroes Full Stack Developer Trial.</p>
        </div>
      </div>
    </footer>
  );
}
