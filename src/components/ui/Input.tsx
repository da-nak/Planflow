import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            "w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors",
            error && "border-danger focus:ring-danger",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground-secondary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={clsx(
            "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors min-h-[100px] resize-y",
            error && "border-danger focus:ring-danger",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
