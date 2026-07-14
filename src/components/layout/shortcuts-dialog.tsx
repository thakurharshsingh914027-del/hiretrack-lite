"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const shortcuts = [
  ["Ctrl / ⌘ + K", "Open the command palette"],
  ["/", "Focus workspace search or commands"],
  ["G then D", "Go to the dashboard"],
  ["G then J", "Go to jobs"],
  ["G then C", "Go to candidates"],
  ["↑ / ↓ + Enter", "Choose and open a command"],
  ["Esc", "Close the current dialog"],
  ["?", "Show this shortcut guide"],
] as const;

type ShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Navigate common HireTrack Lite workflows without leaving the
            keyboard.
          </DialogDescription>
        </DialogHeader>
        <dl className="divide-border mt-2 divide-y">
          {shortcuts.map(([keys, description]) => (
            <div
              key={keys}
              className="flex min-h-14 items-center justify-between gap-5 py-3"
            >
              <dt className="text-muted-foreground text-sm">{description}</dt>
              <dd>
                <kbd className="border-border bg-muted rounded-md border px-2 py-1 font-mono text-xs font-semibold whitespace-nowrap">
                  {keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
