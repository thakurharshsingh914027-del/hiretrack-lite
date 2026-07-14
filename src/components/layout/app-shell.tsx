"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  Columns3Icon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { CommandMenu } from "@/components/layout/command-menu";
import { ShortcutsDialog } from "@/components/layout/shortcuts-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";

const navigation = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/app/jobs", label: "Jobs", icon: BriefcaseBusinessIcon },
  { href: "/app/candidates", label: "Candidates", icon: UsersRoundIcon },
  { href: "/app/pipeline", label: "Pipeline", icon: Columns3Icon },
  { href: "/app/interviews", label: "Interviews", icon: CalendarDaysIcon },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3Icon },
] satisfies ReadonlyArray<{
  href: Route;
  label: string;
  icon: typeof LayoutDashboardIcon;
}>;

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1" aria-label="Workspace navigation">
      {navigation.map((item) => {
        const active =
          item.href === "/app"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            {...(active ? { "aria-current": "page" as const } : {})}
            className={cn(
              "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none",
              active && "bg-sidebar-accent text-sidebar-foreground",
            )}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  organizationName?: string;
};

export function AppShell({
  children,
  userName,
  organizationName,
}: AppShellProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="bg-background min-h-svh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r px-4 py-4 lg:flex">
        <Brand className="px-1" />
        <div className="mt-7">
          <p className="text-muted-foreground mb-2 px-3 text-[11px] font-semibold tracking-[0.12em] uppercase">
            Workspace
          </p>
          <NavigationLinks />
        </div>
        <div className="border-sidebar-border mt-auto grid gap-1 border-t pt-4">
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <HelpCircleIcon className="size-4" aria-hidden="true" />
            Shortcuts
            <kbd className="border-sidebar-border bg-background ml-auto rounded border px-1.5 py-0.5 font-mono text-[10px]">
              ?
            </kbd>
          </button>
          <Link
            href="/app/settings/profile"
            className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <SettingsIcon className="size-4" aria-hidden="true" />
            Settings
          </Link>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="border-border bg-background/90 sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-xl sm:px-6">
          <Dialog
            open={mobileNavigationOpen}
            onOpenChange={setMobileNavigationOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open workspace navigation"
              >
                <MenuIcon aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-sidebar top-0 bottom-0 left-0 h-svh w-[min(20rem,calc(100%-2rem))] max-w-none translate-x-0 translate-y-0 rounded-none rounded-r-xl p-4">
              <DialogHeader className="sr-only">
                <DialogTitle>Workspace navigation</DialogTitle>
                <DialogDescription>
                  Open a HireTrack Lite workspace view.
                </DialogDescription>
              </DialogHeader>
              <div className="pr-12">
                <Brand />
              </div>
              <div className="mt-7">
                <NavigationLinks
                  onNavigate={() => setMobileNavigationOpen(false)}
                />
              </div>
              <div className="mt-auto grid gap-2">
                <div className="border-sidebar-border bg-background flex min-h-11 items-center justify-between rounded-md border px-3 text-sm font-medium">
                  Color theme
                  <ThemeToggle />
                </div>
                <DialogClose asChild>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">Back to product site</Link>
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="border-border bg-card text-muted-foreground hover:border-foreground/20 focus-visible:ring-ring ml-auto flex h-11 w-full max-w-xs items-center gap-2 rounded-md border px-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 sm:max-w-sm lg:ml-0 lg:max-w-md"
          >
            <SearchIcon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Search or jump to…</span>
            <kbd className="border-border bg-muted ml-auto hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto hidden lg:block">
            <ThemeToggle />
          </div>
          {userName && organizationName && (
            <UserMenu name={userName} organization={organizationName} />
          )}
        </header>
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </div>

      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onShortcutsOpen={() => setShortcutsOpen(true)}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
