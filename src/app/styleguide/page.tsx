"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup, Radio } from "@/components/ui/Radio";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { FormField } from "@/components/ui/FormField";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Tooltip } from "@/components/ui/Tooltip";
import { Modal } from "@/components/ui/Modal";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/Dropdown";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { Table } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { ComponentSection } from "@/components/styleguide/ComponentSection";
import { ComponentShowcase } from "@/components/styleguide/ComponentShowcase";

const NAV_ITEMS = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "forms", label: "Forms" },
  { id: "feedback", label: "Feedback" },
  { id: "navigation", label: "Navigation" },
  { id: "data-display", label: "Data Display" },
  { id: "cards", label: "Cards" },
];

function ToastDemo() {
  const { addToast } = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={() =>
          addToast({
            variant: "info",
            title: "Info",
            description: "This is an informational message.",
          })
        }
      >
        Info Toast
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          addToast({
            variant: "success",
            title: "Success",
            description: "Operation completed successfully.",
          })
        }
      >
        Success Toast
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          addToast({
            variant: "warning",
            title: "Warning",
            description: "Please review before proceeding.",
          })
        }
      >
        Warning Toast
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          addToast({
            variant: "error",
            title: "Error",
            description: "Something went wrong.",
          })
        }
      >
        Error Toast
      </Button>
    </div>
  );
}

function StyleguideContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState("option1");
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  const tableData = [
    { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Pending" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Inactive" },
  ];

  const tableColumns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "status",
      header: "Status",
      render: (row: (typeof tableData)[0]) => (
        <Badge
          variant={
            row.status === "Active"
              ? "success"
              : row.status === "Pending"
                ? "warning"
                : "default"
          }
          dot
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="font-serif text-xl text-text-primary">
              HSFX
            </a>
            <span className="text-text-dim">/</span>
            <span className="text-text-secondary">Style Guide</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary mb-4">
            Style Guide
          </h1>
          <p className="text-lg text-text-muted max-w-2xl">
            A comprehensive reference for the HSFX design system. All components
            support light and dark themes.
          </p>
        </div>

        {/* Navigation */}
        <nav className="mb-12 pb-6 border-b border-border">
          <div className="flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Colors */}
        <ComponentSection
          id="colors"
          title="Colors"
          description="The core color palette adapts to light and dark themes."
        >
          <ComponentShowcase title="Background & Surface">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="h-20 rounded-lg bg-background border border-border mb-2" />
                <p className="text-sm text-text-primary">Background</p>
                <p className="text-xs text-text-muted font-mono">#0A0A0A / #FAFAFA</p>
              </div>
              <div>
                <div className="h-20 rounded-lg bg-surface border border-border mb-2" />
                <p className="text-sm text-text-primary">Surface</p>
                <p className="text-xs text-text-muted font-mono">#111111 / #FFFFFF</p>
              </div>
              <div>
                <div className="h-20 rounded-lg bg-border mb-2" />
                <p className="text-sm text-text-primary">Border</p>
                <p className="text-xs text-text-muted font-mono">#1A1A1A / #E5E5E5</p>
              </div>
              <div>
                <div className="h-20 rounded-lg bg-accent mb-2" />
                <p className="text-sm text-text-primary">Accent</p>
                <p className="text-xs text-text-muted font-mono">#4A9EFF</p>
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Text Colors">
            <div className="space-y-3">
              <p className="text-text-primary">Primary Text - Headlines and important content</p>
              <p className="text-text-secondary">Secondary Text - Body text and descriptions</p>
              <p className="text-text-muted">Muted Text - Labels and captions</p>
              <p className="text-text-dim">Dim Text - Disabled and placeholder text</p>
              <p className="text-accent">Accent Text - Links and highlights</p>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Status Colors">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm text-text-secondary">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span className="text-sm text-text-secondary">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm text-text-secondary">Error</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-accent" />
                <span className="text-sm text-text-secondary">Info</span>
              </div>
            </div>
          </ComponentShowcase>
        </ComponentSection>

        {/* Typography */}
        <ComponentSection
          id="typography"
          title="Typography"
          description="Font families and type scale for consistent hierarchy."
        >
          <ComponentShowcase title="Font Families">
            <div className="space-y-4">
              <div>
                <p className="font-serif text-2xl text-text-primary">Instrument Serif</p>
                <p className="text-sm text-text-muted">Used for headlines and display text</p>
              </div>
              <div>
                <p className="font-sans text-2xl text-text-primary">Geist Sans</p>
                <p className="text-sm text-text-muted">Used for body text and UI</p>
              </div>
              <div>
                <p className="font-mono text-2xl text-text-primary">Geist Mono</p>
                <p className="text-sm text-text-muted">Used for code and technical content</p>
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Type Scale">
            <div className="space-y-4">
              <p className="font-serif text-5xl text-text-primary">Hero Headline</p>
              <p className="font-serif text-3xl text-text-primary">Section Heading</p>
              <p className="font-medium text-xl text-text-primary">Card Title</p>
              <p className="text-lg text-text-muted">Body Large</p>
              <p className="text-text-secondary">Body Text</p>
              <p className="text-sm text-text-muted">Small / Label</p>
              <p className="text-xs uppercase tracking-widest text-text-muted">Caption</p>
            </div>
          </ComponentShowcase>
        </ComponentSection>

        {/* Buttons */}
        <ComponentSection
          id="buttons"
          title="Buttons"
          description="Interactive button components with multiple variants."
        >
          <ComponentShowcase title="Button Variants">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Button with Icons">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Item
              </Button>
              <Button variant="ghost">
                Settings
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="ml-2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Button>
            </div>
          </ComponentShowcase>
        </ComponentSection>

        {/* Forms */}
        <ComponentSection
          id="forms"
          title="Form Components"
          description="Input fields, selects, checkboxes, and other form elements."
        >
          <ComponentShowcase title="Input Fields">
            <div className="space-y-4 max-w-md">
              <FormField label="Email" required>
                <Input type="email" placeholder="you@example.com" />
              </FormField>
              <FormField label="Password" hint="Must be at least 8 characters">
                <Input type="password" placeholder="Enter password" />
              </FormField>
              <FormField label="With Error" error="This field is required">
                <Input variant="error" placeholder="Error state" />
              </FormField>
              <FormField label="Bio" optional>
                <Textarea placeholder="Tell us about yourself..." />
              </FormField>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Select">
            <div className="max-w-xs">
              <Select
                placeholder="Choose an option"
                options={[
                  { value: "1", label: "Option 1" },
                  { value: "2", label: "Option 2" },
                  { value: "3", label: "Option 3" },
                  { value: "4", label: "Option 4 (Disabled)", disabled: true },
                ]}
              />
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Checkbox">
            <div className="space-y-4">
              <Checkbox
                label="Accept terms and conditions"
                description="You agree to our Terms of Service and Privacy Policy"
                checked={checkboxChecked}
                onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
              />
              <Checkbox label="Disabled checkbox" disabled />
              <Checkbox label="Indeterminate" checked="indeterminate" />
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Radio Group">
            <RadioGroup value={selectedRadio} onValueChange={setSelectedRadio}>
              <Radio value="option1" label="Option 1" description="Description for option 1" />
              <Radio value="option2" label="Option 2" description="Description for option 2" />
              <Radio value="option3" label="Option 3" />
            </RadioGroup>
          </ComponentShowcase>

          <ComponentShowcase title="Switch">
            <div className="space-y-4">
              <Switch
                label="Enable notifications"
                checked={switchChecked}
                onCheckedChange={setSwitchChecked}
              />
              <Switch label="Small switch" size="sm" />
              <Switch label="Large switch" size="lg" checked />
              <Switch label="Disabled" disabled />
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Label">
            <div className="space-y-2">
              <Label>Default Label</Label>
              <Label required>Required Label</Label>
              <Label optional>Optional Label</Label>
            </div>
          </ComponentShowcase>
        </ComponentSection>

        {/* Feedback */}
        <ComponentSection
          id="feedback"
          title="Feedback Components"
          description="Alerts, toasts, modals, and loading states."
        >
          <ComponentShowcase title="Alert">
            <div className="space-y-4">
              <Alert variant="info" title="Information">
                This is an informational alert message.
              </Alert>
              <Alert variant="success" title="Success">
                Your changes have been saved successfully.
              </Alert>
              <Alert variant="warning" title="Warning" dismissible>
                Please review before proceeding.
              </Alert>
              <Alert variant="error" title="Error">
                Something went wrong. Please try again.
              </Alert>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Toast">
            <ToastDemo />
          </ComponentShowcase>

          <ComponentShowcase title="Modal">
            <div>
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                Open Modal
              </Button>
              <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Modal Title"
                description="This is a description for the modal content."
              >
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    Modal content goes here. You can include any content like forms,
                    images, or other components.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={() => setModalOpen(false)}>
                      Confirm
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Tooltip">
            <div className="flex flex-wrap gap-4">
              <Tooltip content="Tooltip on top" side="top">
                <Button variant="ghost">Top</Button>
              </Tooltip>
              <Tooltip content="Tooltip on right" side="right">
                <Button variant="ghost">Right</Button>
              </Tooltip>
              <Tooltip content="Tooltip on bottom" side="bottom">
                <Button variant="ghost">Bottom</Button>
              </Tooltip>
              <Tooltip content="Tooltip on left" side="left">
                <Button variant="ghost">Left</Button>
              </Tooltip>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Spinner">
            <div className="flex items-center gap-6">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Skeleton">
            <div className="space-y-4 max-w-md">
              <div className="flex items-center gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                </div>
              </div>
              <Skeleton variant="rectangular" height={100} />
            </div>
          </ComponentShowcase>
        </ComponentSection>

        {/* Navigation */}
        <ComponentSection
          id="navigation"
          title="Navigation Components"
          description="Tabs, dropdowns, and breadcrumbs for navigation."
        >
          <ComponentShowcase title="Tabs">
            <Tabs defaultValue="tab1">
              <TabList>
                <Tab value="tab1">Account</Tab>
                <Tab value="tab2">Security</Tab>
                <Tab value="tab3">Notifications</Tab>
              </TabList>
              <TabPanel value="tab1">
                <p className="text-text-secondary">Account settings content goes here.</p>
              </TabPanel>
              <TabPanel value="tab2">
                <p className="text-text-secondary">Security settings content goes here.</p>
              </TabPanel>
              <TabPanel value="tab3">
                <p className="text-text-secondary">Notification preferences go here.</p>
              </TabPanel>
            </Tabs>
          </ComponentShowcase>

          <ComponentShowcase title="Dropdown">
            <Dropdown
              trigger={
                <Button variant="ghost">
                  Options
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="ml-2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </Button>
              }
            >
              <DropdownItem>Profile</DropdownItem>
              <DropdownItem>Settings</DropdownItem>
              <DropdownItem>Billing</DropdownItem>
              <DropdownSeparator />
              <DropdownItem destructive>Sign out</DropdownItem>
            </Dropdown>
          </ComponentShowcase>

          <ComponentShowcase title="Breadcrumb">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Products", href: "/products" },
                { label: "Category", href: "/products/category" },
                { label: "Current Page" },
              ]}
            />
          </ComponentShowcase>
        </ComponentSection>

        {/* Data Display */}
        <ComponentSection
          id="data-display"
          title="Data Display"
          description="Badges, progress bars, avatars, and tables."
        >
          <ComponentShowcase title="Badge">
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="success" dot>
                With Dot
              </Badge>
              <Badge size="sm">Small</Badge>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Progress">
            <div className="space-y-6 max-w-md">
              <Progress value={25} />
              <Progress value={50} variant="success" />
              <Progress value={75} variant="warning" showLabel />
              <Progress value={90} variant="error" size="lg" />
              <Progress value={60} animated />
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Avatar">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar size="sm" fallback="JD" />
                <Avatar size="md" fallback="JS" status="online" />
                <Avatar size="lg" fallback="BJ" status="away" />
                <Avatar size="xl" fallback="AK" status="busy" />
              </div>
              <div>
                <p className="text-sm text-text-muted mb-2">Avatar Group</p>
                <AvatarGroup max={3}>
                  <Avatar fallback="A" />
                  <Avatar fallback="B" />
                  <Avatar fallback="C" />
                  <Avatar fallback="D" />
                  <Avatar fallback="E" />
                </AvatarGroup>
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase title="Table">
            <Table columns={tableColumns} data={tableData} striped />
          </ComponentShowcase>

          <ComponentShowcase title="Empty State">
            <EmptyState
              title="No results found"
              description="Try adjusting your search or filters to find what you're looking for."
              action={<Button variant="primary">Clear filters</Button>}
            />
          </ComponentShowcase>
        </ComponentSection>

        {/* Cards */}
        <ComponentSection
          id="cards"
          title="Cards"
          description="Container components for grouping content."
        >
          <ComponentShowcase title="Card Variants">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-medium text-lg text-text-primary mb-2">Default Card</h3>
                <p className="text-text-muted">
                  Cards provide a container for grouping related content and actions.
                </p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar fallback="JD" status="online" />
                  <div>
                    <p className="font-medium text-text-primary">John Doe</p>
                    <p className="text-sm text-text-muted">Software Engineer</p>
                  </div>
                </div>
                <p className="text-text-secondary">
                  Cards can contain any combination of components.
                </p>
              </Card>
            </div>
          </ComponentShowcase>
        </ComponentSection>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border">
          <p className="text-sm text-text-muted text-center">
            HSFX Design System &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <ToastProvider>
      <StyleguideContent />
    </ToastProvider>
  );
}
