import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-background-secondary rounded-xl border border-border p-6",
          hover && "hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx("mb-4", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3 ref={ref} className={clsx("text-lg font-semibold text-foreground", className)} {...props}>
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx("", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";
