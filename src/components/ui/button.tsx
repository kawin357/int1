import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 dark:shadow-lg dark:shadow-purple-500/20 dark:hover:shadow-purple-500/30",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:shadow-lg dark:shadow-red-500/20 dark:hover:shadow-red-500/30",
        outline: "border border-input dark:border-purple-500/40 bg-background dark:bg-slate-900/40 hover:bg-accent hover:text-accent-foreground dark:hover:bg-purple-900/40 dark:shadow-lg dark:shadow-purple-500/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:shadow-lg dark:shadow-blue-500/20",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-purple-900/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
