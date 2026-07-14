import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary px-4 text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.08)] hover:bg-primary/90 active:translate-y-px",
        secondary:
          "bg-secondary px-4 text-secondary-foreground hover:bg-secondary/75 active:translate-y-px",
        outline:
          "border border-border bg-background px-4 text-foreground hover:border-foreground/20 hover:bg-muted active:translate-y-px",
        ghost: "px-3 text-foreground hover:bg-muted",
        link: "min-h-0 p-0 text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-destructive px-4 text-white hover:bg-destructive/90 active:translate-y-px",
      },
      size: {
        default: "h-11",
        sm: "h-11 px-3 text-xs",
        lg: "h-12 rounded-lg px-5 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
