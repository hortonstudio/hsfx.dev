"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { forwardRef } from "react";

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  size?: "sm" | "md" | "lg";
}

export const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ label, size = "md", className = "", ...props }, ref) => {
  const sizeStyles = {
    sm: { root: "h-4 w-7", thumb: "h-3 w-3 data-[state=checked]:translate-x-3" },
    md: { root: "h-5 w-9", thumb: "h-4 w-4 data-[state=checked]:translate-x-4" },
    lg: { root: "h-6 w-11", thumb: "h-5 w-5 data-[state=checked]:translate-x-5" },
  };

  return (
    <div className="flex items-center gap-3">
      <SwitchPrimitive.Root
        ref={ref}
        className={`
          peer inline-flex shrink-0 cursor-pointer items-center rounded-full
          border-2 border-transparent
          bg-border transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
          disabled:cursor-not-allowed disabled:opacity-50
          data-[state=checked]:bg-accent
          ${sizeStyles[size].root}
          ${className}
        `}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={`
            pointer-events-none block rounded-full bg-white shadow-lg
            ring-0 transition-transform
            data-[state=unchecked]:translate-x-0
            ${sizeStyles[size].thumb}
          `}
        />
      </SwitchPrimitive.Root>
      {label && (
        <label className="text-sm font-medium text-text-primary cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
});

Switch.displayName = "Switch";
