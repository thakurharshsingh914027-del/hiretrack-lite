import Link from "next/link";
import { ArrowLeftIcon, CompassIcon } from "lucide-react";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="grid min-h-[68svh] place-items-center px-4 py-20 sm:px-6"
      >
        <div className="max-w-xl text-center">
          <span className="bg-accent text-accent-foreground mx-auto grid size-14 place-items-center rounded-xl">
            <CompassIcon className="size-6" aria-hidden="true" />
          </span>
          <p className="text-primary mt-6 font-mono text-sm font-semibold">
            404 · ROUTE NOT FOUND
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
            This candidate took another route.
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md leading-7">
            The page may have moved or never existed. Return to the product site
            or open the documentation.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">
                <ArrowLeftIcon aria-hidden="true" />
                Return home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs">Browse documentation</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
