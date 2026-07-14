import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { createFaqJsonLd, faqs } from "@/lib/faq";
import { absoluteUrl, createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Applicant tracking questions and answers",
  description:
    "Find clear answers about the current HireTrack Lite foundation, planned recruiting workflows, data handling, resumes, access roles, licensing, and team fit.",
  path: "/faq",
});

export default function FaqPage() {
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
        name: "FAQ",
        item: absoluteUrl("/faq"),
      },
    ],
  };

  return (
    <>
      <JsonLd data={createFaqJsonLd()} />
      <JsonLd data={breadcrumbJsonLd} />
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto min-h-[65svh] max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <nav
          aria-label="Breadcrumb"
          className="text-muted-foreground flex items-center gap-1 text-xs"
        >
          <Link
            href="/"
            className="hover:text-foreground inline-flex min-h-11 items-center"
          >
            Home
          </Link>
          <ChevronRightIcon className="size-3.5" aria-hidden="true" />
          <span aria-current="page">FAQ</span>
        </nav>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Frequently asked questions
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-8">
          Straight answers about how HireTrack Lite is designed to work and who
          it serves.
        </p>
        <div className="divide-border border-border mt-10 divide-y border-y">
          {faqs.map((faq) => (
            <article key={faq.question} className="py-6">
              <h2 className="text-lg font-semibold">{faq.question}</h2>
              <p className="text-muted-foreground mt-2 leading-7">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
