import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/site";

type DocsPageProps = {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
};

export function DocsPage({
  title,
  description,
  path,
  children,
}: DocsPageProps) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Documentation",
        item: absoluteUrl("/docs"),
      },
      ...(path === "/docs"
        ? []
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: title,
              item: absoluteUrl(path),
            },
          ]),
    ],
  };

  return (
    <main id="main-content" className="min-w-0 pb-16">
      <JsonLd data={breadcrumbJsonLd} />
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mb-8 flex flex-wrap items-center gap-1 text-xs"
      >
        <Link
          className="hover:text-foreground inline-flex min-h-11 items-center rounded-md"
          href="/"
        >
          Home
        </Link>
        <ChevronRightIcon className="size-3.5" aria-hidden="true" />
        {path === "/docs" ? (
          <span aria-current="page">Documentation</span>
        ) : (
          <>
            <Link
              className="hover:text-foreground inline-flex min-h-11 items-center rounded-md"
              href="/docs"
            >
              Documentation
            </Link>
            <ChevronRightIcon className="size-3.5" aria-hidden="true" />
            <span aria-current="page">{title}</span>
          </>
        )}
      </nav>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-4 text-base leading-7 sm:text-lg">
          {description}
        </p>
      </div>
      <div className="[&_a]:text-primary [&_code]:bg-muted [&_p]:text-muted-foreground [&_strong]:text-foreground mt-10 max-w-3xl text-[15px] leading-7 [&_a]:font-medium [&_a]:underline-offset-4 hover:[&_a]:underline [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.025em] [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:pl-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-5 [&_p]:my-4 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-5">
        {children}
      </div>
    </main>
  );
}
