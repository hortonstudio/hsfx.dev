"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { forwardRef } from "react";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function Dropdown({ trigger, children, align = "end" }: DropdownProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={4}
          className="
            z-50 min-w-[180px] overflow-hidden
            bg-surface border border-border rounded-lg p-1 shadow-lg
            animate-in fade-in-0 zoom-in-95
            data-[side=bottom]:slide-in-from-top-2
            data-[side=left]:slide-in-from-right-2
            data-[side=right]:slide-in-from-left-2
            data-[side=top]:slide-in-from-bottom-2
          "
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

interface DropdownItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  children: React.ReactNode;
  destructive?: boolean;
}

export const DropdownItem = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownItemProps
>(({ children, destructive = false, className = "", ...props }, ref) => {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={`
        relative flex items-center px-3 py-2 text-sm rounded-md
        cursor-pointer select-none outline-none
        transition-colors
        ${
          destructive
            ? "text-red-400 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-400"
            : "text-text-primary data-[highlighted]:bg-accent/10 data-[highlighted]:text-accent"
        }
        data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
});

DropdownItem.displayName = "DropdownItem";

export function DropdownSeparator() {
  return (
    <DropdownMenuPrimitive.Separator className="h-px my-1 bg-border" />
  );
}

interface DropdownLabelProps {
  children: React.ReactNode;
}

export function DropdownLabel({ children }: DropdownLabelProps) {
  return (
    <DropdownMenuPrimitive.Label className="px-3 py-1.5 text-xs font-medium text-text-muted">
      {children}
    </DropdownMenuPrimitive.Label>
  );
}
