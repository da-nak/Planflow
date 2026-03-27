import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    return (
      <div ref={ref} className={clsx("w-full", className)} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-foreground-secondary">Progress</span>
            <span className="text-sm font-medium text-foreground">{Math.round(percentage)}%</span>
          </div>
        )}
        <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";
