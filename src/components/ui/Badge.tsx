import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" |
  "work" | "study" | "health" | "personal" | "social" | "other";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          {
            "bg-background-tertiary text-foreground-secondary": variant === "default",
            "bg-primary/10 text-primary": variant === "primary",
            "bg-success/10 text-success": variant === "success",
            "bg-warning/10 text-warning": variant === "warning",
            "bg-danger/10 text-danger": variant === "danger",
            "bg-info/10 text-info": variant === "info",
            "bg-work/10 text-work": variant === "work",
            "bg-study/10 text-study": variant === "study",
            "bg-health/10 text-health": variant === "health",
            "bg-personal/10 text-personal": variant === "personal",
            "bg-social/10 text-social": variant === "social",
            "bg-other/10 text-other": variant === "other",
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
