"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef } from "react";

interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  children: React.ReactNode;
}

export const Tabs = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ children, className = "", ...props }, ref) => {
  return (
    <TabsPrimitive.Root ref={ref} className={className} {...props}>
      {children}
    </TabsPrimitive.Root>
  );
});

Tabs.displayName = "Tabs";

interface TabListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  children: React.ReactNode;
}

export const TabList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabListProps
>(({ children, className = "", ...props }, ref) => {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={`
        inline-flex items-center gap-1 p-1 rounded-lg bg-surface border border-border
        ${className}
      `}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
});

TabList.displayName = "TabList";

interface TabProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  children: React.ReactNode;
}

export const Tab = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabProps
>(({ children, className = "", ...props }, ref) => {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={`
        px-4 py-2 text-sm font-medium rounded-md
        text-text-muted transition-colors
        hover:text-text-primary
        data-[state=active]:bg-background data-[state=active]:text-text-primary
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
        ${className}
      `}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
});

Tab.displayName = "Tab";

interface TabPanelProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  children: React.ReactNode;
}

export const TabPanel = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabPanelProps
>(({ children, className = "", ...props }, ref) => {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={`
        mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg
        ${className}
      `}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  );
});

TabPanel.displayName = "TabPanel";
