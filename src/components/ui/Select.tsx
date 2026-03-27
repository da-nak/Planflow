import { SelectHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground-secondary mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={clsx(
            "w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors appearance-none cursor-pointer",
            error && "border-danger focus:ring-danger",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
