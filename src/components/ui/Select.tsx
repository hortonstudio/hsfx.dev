"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  variant?: "default" | "error" | "success";
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      placeholder = "Select an option",
      value,
      onValueChange,
      disabled,
      variant = "default",
      className = "",
    },
    ref
  ) => {
    const variantStyles = {
      default: "border-border focus:border-accent",
      error: "border-red-500 focus:border-red-500",
      success: "border-green-500 focus:border-green-500",
    };

    return (
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          className={`
            flex items-center justify-between w-full bg-background border rounded-lg px-4 py-3
            text-text-primary placeholder:text-text-dim
            focus:outline-none focus:ring-1 focus:ring-accent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${variantStyles[variant]}
            ${className}
          `}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="text-text-muted">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="overflow-hidden bg-surface border border-border rounded-lg shadow-lg z-50"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={`
                    relative flex items-center px-3 py-2 rounded-md text-sm text-text-primary
                    cursor-pointer select-none outline-none
                    data-[highlighted]:bg-accent/10 data-[highlighted]:text-accent
                    data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed
                    transition-colors
                  `}
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  }
);

Select.displayName = "Select";
