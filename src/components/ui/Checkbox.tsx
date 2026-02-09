"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { forwardRef } from "react";

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ label, description, className = "", ...props }, ref) => {
  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        ref={ref}
        className={`
          peer h-5 w-5 shrink-0 rounded border border-border bg-background
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
          disabled:cursor-not-allowed disabled:opacity-50
          data-[state=checked]:bg-accent data-[state=checked]:border-accent
          data-[state=indeterminate]:bg-accent data-[state=indeterminate]:border-accent
          transition-colors
          ${className}
        `}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          {props.checked === "indeterminate" ? (
            <svg
              width="10"
              height="2"
              viewBox="0 0 10 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="1" y1="1" x2="9" y2="1" />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label className="text-sm font-medium text-text-primary cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-text-muted">{description}</p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = "Checkbox";
