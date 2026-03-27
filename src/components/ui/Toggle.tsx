"use client";

import { clsx } from "clsx";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, disabled = false, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        checked ? "bg-primary" : "bg-background-tertiary",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span
        className={clsx(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
