"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const navigation = [
  { href: "/docs/features", label: "Features" },
  { href: "/docs", label: "Docs" },
  { href: "/#security", label: "Security" },
] as const;

export function SiteHeader() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <header className="border-border/75 bg-background/88 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navigation.map((item) => (
            <Button key={item.href} asChild variant="ghost">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/app">Open workspace</Link>
          </Button>
          <Dialog
            open={mobileNavigationOpen}
            onOpenChange={setMobileNavigationOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <MenuIcon aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="top-0 right-0 bottom-0 left-auto h-svh w-[min(22rem,calc(100%-2rem))] max-w-none translate-x-0 translate-y-0 rounded-none rounded-l-xl p-5">
              <DialogHeader className="sr-only">
                <DialogTitle>Navigation</DialogTitle>
                <DialogDescription>Browse HireTrack Lite</DialogDescription>
              </DialogHeader>
              <div className="pr-12">
                <Brand />
              </div>
              <nav className="mt-8 grid gap-2" aria-label="Mobile navigation">
                {navigation.map((item) => (
                  <Button
                    key={item.href}
                    asChild
                    variant="ghost"
                    className="justify-start text-base"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileNavigationOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </nav>
              <Button asChild className="mt-auto w-full">
                <Link
                  href="/app"
                  onClick={() => setMobileNavigationOpen(false)}
                >
                  Open workspace
                </Link>
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
