"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { forwardRef } from "react";

interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  children: React.ReactNode;
}

export const RadioGroup = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ children, className = "", ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={`flex flex-col gap-3 ${className}`}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Root>
  );
});

RadioGroup.displayName = "RadioGroup";

interface RadioProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioProps
>(({ label, description, className = "", ...props }, ref) => {
  return (
    <div className="flex items-start gap-3">
      <RadioGroupPrimitive.Item
        ref={ref}
        className={`
          h-5 w-5 shrink-0 rounded-full border border-border bg-background
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background
          disabled:cursor-not-allowed disabled:opacity-50
          data-[state=checked]:border-accent
          transition-colors
          ${className}
        `}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-accent" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
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

Radio.displayName = "Radio";
