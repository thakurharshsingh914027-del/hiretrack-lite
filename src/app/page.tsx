import type { LucideIcon } from "lucide-react";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CalendarCheck2Icon,
  CheckIcon,
  ClipboardCheckIcon,
  FilesIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { ProductPreview } from "@/components/marketing/product-preview";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createFaqJsonLd, faqs } from "@/lib/faq";
import { absoluteUrl, createMetadata, siteConfig } from "@/lib/site";

export const metadata = createMetadata({
  title: "Applicant tracking for small teams",
  description:
    "Explore the HireTrack Lite foundation for small hiring teams, with accessible product previews and a transparent roadmap toward secure recruiting workflows.",
  path: "/",
});

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    title: "One calm pipeline",
    description:
      "See who needs attention, move applications forward, and keep every stage change in context.",
    icon: ClipboardCheckIcon,
  },
  {
    title: "Candidate context",
    description:
      "Keep resumes, skills, notes, applications, and interview history connected to one profile.",
    icon: UsersRoundIcon,
  },
  {
    title: "Interview coordination",
    description:
      "Schedule interviewers, meeting details, feedback, and outcomes without another spreadsheet.",
    icon: CalendarCheck2Icon,
  },
  {
    title: "Useful hiring signals",
    description:
      "Understand pipeline balance, applications by job, hires over time, and interview completion.",
    icon: BarChart3Icon,
  },
  {
    title: "Clear accountability",
    description:
      "A searchable audit trail records who changed what and when across the workspace.",
    icon: FilesIcon,
  },
  {
    title: "Access with boundaries",
    description:
      "Admin, recruiter, and viewer permissions are enforced on the server and scoped to one organization.",
    icon: ShieldCheckIcon,
  },
];

const workflow = [
  "Open a role with the details your team actually needs.",
  "Add candidates once, then connect them to the right jobs.",
  "Move each application through screening, interviews, and decisions.",
  "Use live activity and analytics to find the next bottleneck.",
] as const;

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteConfig.description,
  url: absoluteUrl("/"),
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const faqJsonLd = createFaqJsonLd();

export default function HomePage() {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd} />
      <JsonLd data={faqJsonLd} />
      <SiteHeader />
      <main id="main-content" className="overflow-hidden">
        <section className="relative px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24 lg:px-8">
          <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_68%)]" />
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 gap-2 px-3 py-1.5" variant="default">
              <SparklesIcon className="size-3.5" aria-hidden="true" />
              Built for focused recruiting teams
            </Badge>
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
              Hiring momentum,
              <span className="text-primary block">minus the overhead.</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-7 text-balance sm:text-lg sm:leading-8">
              Keep jobs, candidates, interviews, notes, and decisions in one
              clear trail—so a small team always knows what moves next.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/app">
                  Open workspace
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/docs/features">Explore the product</Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-4 text-xs">
              Open source · Organization-scoped · Designed for keyboard and
              mobile
            </p>
          </div>
        </section>

        <section
          className="px-4 pb-24 sm:px-6 lg:px-8"
          aria-labelledby="preview-heading"
        >
          <h2 id="preview-heading" className="sr-only">
            Product preview
          </h2>
          <ProductPreview />
        </section>

        <section
          className="border-border bg-card border-y px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-primary text-sm font-semibold">
                Everything in its place
              </p>
              <h2
                id="features-heading"
                className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl"
              >
                Less chasing. More forward motion.
              </h2>
              <p className="text-muted-foreground mt-4 text-base leading-7">
                HireTrack Lite keeps the essential recruiting workflow connected
                without turning a small team into software administrators.
              </p>
            </div>
            <div className="border-border bg-border mt-12 grid gap-px overflow-hidden rounded-xl border md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="bg-card p-6 sm:p-8">
                  <span className="bg-accent text-accent-foreground grid size-11 place-items-center rounded-lg">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="workflow-heading"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-primary text-sm font-semibold">
                A workflow people understand
              </p>
              <h2
                id="workflow-heading"
                className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl"
              >
                From open role to confident decision.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-lg leading-7">
                The core flow stays visible, shareable, and fast enough to
                complete without a training manual.
              </p>
            </div>
            <ol className="grid gap-4">
              {workflow.map((step, index) => (
                <li key={step}>
                  <Card className="gap-0 py-0 shadow-none">
                    <CardContent className="flex gap-4 p-5 sm:items-center sm:p-6">
                      <span className="bg-foreground text-background grid size-10 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="pt-2 leading-7 sm:pt-0">{step}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="security"
          className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8"
          aria-labelledby="security-heading"
        >
          <div className="bg-foreground text-background mx-auto max-w-7xl rounded-2xl px-6 py-10 sm:px-10 sm:py-14 lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:px-14">
            <div>
              <ShieldCheckIcon
                className="text-primary size-8"
                aria-hidden="true"
              />
              <h2
                id="security-heading"
                className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl"
              >
                Trust shapes the release plan.
              </h2>
              <p className="text-background/70 mt-4 max-w-xl leading-7">
                Recruiting data is sensitive. The full release is designed
                around server-enforced roles and organization ownership from the
                first protected query.
              </p>
            </div>
            <ul className="text-background/80 mt-8 grid gap-4 text-sm leading-6 lg:mt-0 lg:self-center">
              {[
                "Server enforcement for admin, recruiter, and viewer permissions.",
                "Organization scope on every protected record.",
                "Private resumes, validated inputs, and auditable changes.",
                "Secure sessions, verification, reset tokens, and rate limits.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="bg-primary text-primary-foreground mt-0.5 grid size-6 shrink-0 place-items-center rounded-full">
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="border-border bg-card border-t px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="faq-heading"
        >
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-primary text-sm font-semibold">
                Questions, answered
              </p>
              <h2
                id="faq-heading"
                className="mt-3 text-3xl font-semibold tracking-[-0.035em]"
              >
                Before you start
              </h2>
            </div>
            <div className="divide-border border-border divide-y border-y">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-1">
                  <summary className="focus-visible:ring-ring flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-md py-3 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span
                      className="text-primary text-xl font-normal transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-muted-foreground max-w-2xl pb-5 text-sm leading-6">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          className="px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8"
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="cta-heading"
              className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl"
            >
              Give every candidate a clear next step.
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl leading-7">
              Start with a focused workspace built around the way a small hiring
              team actually moves.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/app">
                Open HireTrack Lite
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
