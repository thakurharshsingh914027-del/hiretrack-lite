"use client";

import { useEffect, useRef } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  BarChart3Icon,
  BookOpenIcon,
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  Columns3Icon,
  LayoutDashboardIcon,
  UsersRoundIcon,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const commands = [
  {
    href: "/app",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    shortcut: "G D",
  },
  {
    href: "/app/jobs",
    label: "Jobs",
    icon: BriefcaseBusinessIcon,
    shortcut: "G J",
  },
  {
    href: "/app/candidates",
    label: "Candidates",
    icon: UsersRoundIcon,
    shortcut: "G C",
  },
  {
    href: "/app/pipeline",
    label: "Pipeline",
    icon: Columns3Icon,
    shortcut: "G P",
  },
  {
    href: "/app/interviews",
    label: "Interviews",
    icon: CalendarDaysIcon,
    shortcut: "G I",
  },
  {
    href: "/app/analytics",
    label: "Analytics",
    icon: BarChart3Icon,
    shortcut: "G A",
  },
] satisfies ReadonlyArray<{
  href: Route;
  label: string;
  icon: typeof LayoutDashboardIcon;
  shortcut: string;
}>;

const routeShortcuts = new Map(
  commands.map((command) => [
    command.shortcut.at(-1)?.toLowerCase(),
    command.href,
  ]),
);

type CommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShortcutsOpen: () => void;
};

export function CommandMenu({
  open,
  onOpenChange,
  onShortcutsOpen,
}: CommandMenuProps) {
  const router = useRouter();
  const routePrefixActive = useRef(false);
  const routePrefixTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    function resetRoutePrefix() {
      routePrefixActive.current = false;
      if (routePrefixTimeout.current) {
        clearTimeout(routePrefixTimeout.current);
        routePrefixTimeout.current = undefined;
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        resetRoutePrefix();
        onOpenChange(!open);
        return;
      }

      if (
        isEditable ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        resetRoutePrefix();
        return;
      }

      const key = event.key.toLowerCase();

      if (routePrefixActive.current) {
        const href = routeShortcuts.get(key);
        resetRoutePrefix();

        if (href) {
          event.preventDefault();
          onOpenChange(false);
          router.push(href);
        }
        return;
      }

      if (key === "g") {
        routePrefixActive.current = true;
        routePrefixTimeout.current = setTimeout(resetRoutePrefix, 1_000);
      } else if (event.key === "/") {
        event.preventDefault();
        onOpenChange(true);
      } else if (event.key === "?") {
        event.preventDefault();
        onShortcutsOpen();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      resetRoutePrefix();
    };
  }, [onOpenChange, onShortcutsOpen, open, router]);

  function runCommand(href: Route) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Search and open a HireTrack Lite view.
          </DialogDescription>
        </DialogHeader>
        <Command label="Workspace navigation" loop vimBindings>
          <CommandInput placeholder="Search pages and actions…" autoFocus />
          <CommandList>
            <CommandEmpty>No matching page. Try another search.</CommandEmpty>
            <CommandGroup heading="Workspace">
              {commands.map((command) => (
                <CommandItem
                  key={command.href}
                  value={command.label}
                  onSelect={() => runCommand(command.href)}
                >
                  <command.icon aria-hidden="true" />
                  {command.label}
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Help">
              <CommandItem
                value="Documentation"
                onSelect={() => runCommand("/docs")}
              >
                <BookOpenIcon aria-hidden="true" />
                Documentation
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <div className="border-border text-muted-foreground flex items-center gap-4 border-t px-4 py-2 text-[11px]">
            <span>
              <kbd className="font-mono">↑↓</kbd> move
            </span>
            <span>
              <kbd className="font-mono">Enter</kbd> open
            </span>
            <span>
              <kbd className="font-mono">Esc</kbd> close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
