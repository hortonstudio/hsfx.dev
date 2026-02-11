"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
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
import { Sidebar, useActiveSection, type NavItem, type Category } from "@/components/styleguide/Sidebar";
import { Icons } from "@/components/ui/Icons";
import {
  AuthCard,
  SocialButton,
  AuthDivider,
  LoginForm,
  SignupForm,
} from "@/components/ui/AuthForms";
import { ClickableImage, ImageGallery } from "@/components/ui/ImageModal";
import {
  Callout,
  NumberedSteps,
  NumberedStep,
  APIReference,
  KeyboardShortcut,
  CodeBlockWithCopy,
  FileTree,
} from "@/components/ui/Docs";
import {
  DownloadButton,
  DownloadCard,
  DownloadLink,
} from "@/components/ui/DownloadButton";
import { CodeEditor } from "@/components/ui/CodeEditor";
import { WebflowNavigator, type TreeNode } from "@/components/ui/WebflowNavigator";
import { WebflowProperties, type PropertySection } from "@/components/ui/WebflowProperties";

const NAV_ITEMS: NavItem[] = [
  { id: "colors", label: "Colors", category: "foundations" },
  { id: "typography", label: "Typography", category: "foundations" },
  { id: "icons", label: "Icons", category: "foundations" },
  { id: "buttons", label: "Buttons", category: "components" },
  { id: "forms", label: "Forms", category: "components" },
  { id: "feedback", label: "Feedback", category: "components" },
  { id: "navigation", label: "Navigation", category: "components" },
  { id: "data-display", label: "Data Display", category: "components" },
  { id: "cards", label: "Cards", category: "components" },
  { id: "auth", label: "Authentication", category: "patterns" },
  { id: "modals", label: "Modals & Images", category: "patterns" },
  { id: "docs", label: "Documentation", category: "patterns" },
  { id: "downloads", label: "Downloads", category: "patterns" },
  { id: "code-editor", label: "Code Editor", category: "patterns" },
  { id: "webflow-editor", label: "Webflow Editor", category: "patterns" },
];

// Sample data for Webflow Navigator
const sampleTreeNodes: TreeNode[] = [
  {
    id: "body",
    label: "Body",
    type: "element",
    children: [
      {
        id: "page-wrap",
        label: "page_wrap",
        type: "element",
        children: [
          { id: "transition", label: "Transition", type: "component" },
          {
            id: "page-contain",
            label: "page_contain",
            type: "element",
            children: [
              { id: "global", label: "Global Element", type: "component" },
              {
                id: "page-slot",
                label: "Page Slot",
                type: "slot",
                children: [
                  {
                    id: "header",
                    label: "Header / Home",
                    type: "component",
                    children: [
                      {
                        id: "bg",
                        label: "Background",
                        type: "slot",
                        children: [
                          { id: "visual", label: "Visual", type: "component" },
                        ],
                      },
                      {
                        id: "content",
                        label: "Content",
                        type: "slot",
                        children: [
                          { id: "typo-tag", label: "Typography Tag", type: "component" },
                          { id: "typo-heading", label: "Typography Heading", type: "component" },
                          { id: "typo-para", label: "Typography Paragraph", type: "component" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// Sample properties for Webflow Properties panel
const samplePropertySections: PropertySection[] = [
  {
    id: "settings",
    label: "Settings",
    defaultExpanded: true,
    fields: [
      { id: "role", label: "Role", type: "text", value: "", helpText: "ARIA role attribute" },
      { id: "buttonText", label: "Button Text", type: "text", value: "Button Text" },
      {
        id: "buttonLink",
        label: "Button Link",
        type: "link",
        value: { type: "url", url: "#", openIn: "this", preload: "default" },
      },
      { id: "leftIcon", label: "Left Icon", type: "slot", value: null },
      { id: "rightIcon", label: "Right Icon", type: "slot", value: null },
    ],
  },
  {
    id: "style",
    label: "Style",
    defaultExpanded: true,
    fields: [
      {
        id: "variant",
        label: "Style",
        type: "style",
        value: "primary",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Ghost", value: "ghost" },
        ],
      },
      {
        id: "disableAnimation",
        label: "Disable Animation",
        type: "toggle",
        value: false,
        helpText: "Turn off hover animations",
      },
    ],
  },
  {
    id: "visibility",
    label: "Visibility",
    defaultExpanded: true,
    fields: [
      {
        id: "visibility",
        label: "Visibility",
        type: "segmented",
        value: "visible",
        options: [
          { label: "Visible", value: "visible" },
          { label: "Hidden", value: "hidden" },
        ],
      },
    ],
  },
];

const CATEGORIES: Category[] = [
  { id: "foundations", label: "Foundations" },
  { id: "components", label: "Components" },
  { id: "patterns", label: "Patterns" },
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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const activeSection = useActiveSection(NAV_ITEMS.map((item) => item.id));

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

  const galleryImages = [
    { src: "https://picsum.photos/800/600?random=1", alt: "Sample 1", caption: "Beautiful landscape" },
    { src: "https://picsum.photos/800/600?random=2", alt: "Sample 2", caption: "Urban architecture" },
    { src: "https://picsum.photos/800/600?random=3", alt: "Sample 3", caption: "Nature photography" },
  ];

  const iconGroups = [
    {
      name: "Navigation",
      icons: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "ChevronDown", "ChevronUp", "ChevronLeft", "ChevronRight", "Menu", "X", "Search", "ExternalLink"],
    },
    {
      name: "Actions",
      icons: ["Download", "Upload", "Copy", "Edit", "Trash", "Plus", "Minus", "Settings", "Refresh"],
    },
    {
      name: "Status",
      icons: ["Check", "CheckCircle", "Warning", "Error", "Info", "AlertCircle"],
    },
    {
      name: "Social",
      icons: ["GitHub", "Twitter", "Discord", "LinkedIn", "YouTube"],
    },
    {
      name: "Misc",
      icons: ["Sun", "Moon", "Eye", "EyeOff", "Link", "Mail", "User", "Lock", "File", "Folder", "Heart", "Star", "Code", "Terminal", "Zap", "Filter", "Calendar", "Clock"],
    },
  ];

  const buttonProps = [
    { name: "variant", type: "'primary' | 'ghost' | 'outline'", default: "'primary'", description: "Visual style of the button" },
    { name: "size", type: "'sm' | 'md' | 'lg'", default: "'md'", description: "Size of the button" },
    { name: "disabled", type: "boolean", default: "false", description: "Whether the button is disabled" },
    { name: "children", type: "ReactNode", required: true, description: "Content of the button" },
  ];

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-20">
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <Sidebar
          items={NAV_ITEMS}
          categories={CATEGORIES}
          activeSection={activeSection}
        />

        {/* Main Content */}
        <main className="flex-1 px-6 py-12 lg:pl-12">
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
                  <p className="text-xs text-text-muted font-mono">#0EA5E9</p>
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

          {/* Icons */}
          <ComponentSection
            id="icons"
            title="Icons"
            description="SVG icon library with consistent sizing and stroke width."
          >
            {iconGroups.map((group) => (
              <ComponentShowcase key={group.name} title={group.name}>
                <div className="flex flex-wrap gap-4">
                  {group.icons.map((iconName) => {
                    const IconComponent = Icons[iconName as keyof typeof Icons];
                    return (
                      <Tooltip key={iconName} content={iconName}>
                        <div className="p-3 bg-surface border border-border rounded-lg hover:border-accent/50 transition-colors cursor-pointer">
                          <IconComponent size={24} className="text-text-secondary" />
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </ComponentShowcase>
            ))}
          </ComponentSection>

          {/* Buttons */}
          <ComponentSection
            id="buttons"
            title="Buttons"
            description="Interactive button components with glow effects and multiple variants."
          >
            <ComponentShowcase title="Button Variants" description="Hover to see glow effects">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Button Sizes">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Outline Sizes">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="outline" size="sm">Small</Button>
                <Button variant="outline" size="md">Medium</Button>
                <Button variant="outline" size="lg">Large</Button>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="With Icons">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">
                  <Icons.Plus size={16} />
                  Add Item
                </Button>
                <Button variant="outline">
                  <Icons.Edit size={16} />
                  Edit
                </Button>
                <Button variant="ghost">
                  Learn more
                  <Icons.ArrowRight size={16} />
                </Button>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Disabled States">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" disabled>Primary</Button>
                <Button variant="outline" disabled>Outline</Button>
                <Button variant="ghost" disabled>Ghost</Button>
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
                    <Icons.ChevronDown size={16} />
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

          {/* Authentication */}
          <ComponentSection
            id="auth"
            title="Authentication"
            description="Login, signup, and password reset forms."
          >
            <ComponentShowcase title="Login Form">
              <div className="max-w-md mx-auto">
                <AuthCard
                  title="Welcome back"
                  description="Sign in to your account to continue"
                  footer={
                    <span className="text-text-muted">
                      Don&apos;t have an account?{" "}
                      <a href="#" className="text-accent hover:text-accent-hover">
                        Sign up
                      </a>
                    </span>
                  }
                >
                  <div className="space-y-4">
                    <SocialButton provider="github" />
                    <SocialButton provider="google" />
                    <AuthDivider text="or continue with email" />
                    <LoginForm
                      onSubmit={(data) => console.log("Login:", data)}
                      onForgotPassword={() => console.log("Forgot password")}
                    />
                  </div>
                </AuthCard>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Signup Form">
              <div className="max-w-md mx-auto">
                <AuthCard
                  title="Create an account"
                  description="Get started with your free account"
                  showLogo={false}
                >
                  <SignupForm onSubmit={(data) => console.log("Signup:", data)} />
                </AuthCard>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Social Buttons">
              <div className="flex flex-col gap-3 max-w-xs">
                <SocialButton provider="google" />
                <SocialButton provider="github" />
                <SocialButton provider="twitter" />
              </div>
            </ComponentShowcase>
          </ComponentSection>

          {/* Modals & Images */}
          <ComponentSection
            id="modals"
            title="Modals & Images"
            description="Lightbox modals and clickable image galleries."
          >
            <ComponentShowcase title="Clickable Image">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ClickableImage
                  src="https://picsum.photos/400/300?random=1"
                  alt="Sample image"
                  caption="Click to view full size"
                  className="aspect-video"
                />
                <ClickableImage
                  src="https://picsum.photos/400/300?random=2"
                  alt="Sample image 2"
                  caption="Beautiful landscape"
                  className="aspect-video"
                />
                <ClickableImage
                  src="https://picsum.photos/400/300?random=3"
                  alt="Sample image 3"
                  caption="Urban photography"
                  className="aspect-video"
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Image Gallery">
              <div>
                <div className="grid grid-cols-3 gap-2 max-w-md">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setGalleryIndex(idx);
                        setGalleryOpen(true);
                      }}
                      className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <ImageGallery
                  images={galleryImages}
                  initialIndex={galleryIndex}
                  isOpen={galleryOpen}
                  onClose={() => setGalleryOpen(false)}
                />
              </div>
            </ComponentShowcase>
          </ComponentSection>

          {/* Documentation */}
          <ComponentSection
            id="docs"
            title="Documentation"
            description="Components for building documentation pages."
          >
            <ComponentShowcase title="Callouts">
              <div className="space-y-4">
                <Callout variant="info" title="Information">
                  This is an informational callout for general notes and tips.
                </Callout>
                <Callout variant="warning" title="Warning">
                  Be careful when using this feature in production.
                </Callout>
                <Callout variant="error" title="Danger">
                  This action cannot be undone.
                </Callout>
                <Callout variant="success" title="Success">
                  Your changes have been saved successfully.
                </Callout>
                <Callout variant="tip" title="Pro Tip">
                  Use keyboard shortcuts to speed up your workflow.
                </Callout>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Steps">
              <NumberedSteps>
                <NumberedStep title="Install the package">
                  <p>Run the following command in your terminal:</p>
                  <CodeBlockWithCopy code="npm install @hsfx/ui" language="bash" />
                </NumberedStep>
                <NumberedStep title="Import components">
                  <p>Import the components you need in your project:</p>
                  <CodeBlockWithCopy
                    code={`import { Button, Card } from '@hsfx/ui';`}
                    language="typescript"
                  />
                </NumberedStep>
                <NumberedStep title="Start using">
                  <p>Use the components in your React application.</p>
                </NumberedStep>
              </NumberedSteps>
            </ComponentShowcase>

            <ComponentShowcase title="API Reference">
              <APIReference props={buttonProps} />
            </ComponentShowcase>

            <ComponentShowcase title="Keyboard Shortcuts">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <KeyboardShortcut keys={["Cmd", "K"]} />
                  <span className="text-sm text-text-secondary">Open command palette</span>
                </div>
                <div className="flex items-center gap-3">
                  <KeyboardShortcut keys={["Cmd", "Shift", "P"]} />
                  <span className="text-sm text-text-secondary">Quick actions</span>
                </div>
                <div className="flex items-center gap-3">
                  <KeyboardShortcut keys={["Esc"]} />
                  <span className="text-sm text-text-secondary">Close modal</span>
                </div>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Code Block">
              <CodeBlockWithCopy
                code={`function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));`}
                language="typescript"
                filename="greeting.ts"
                showLineNumbers
              />
            </ComponentShowcase>

            <ComponentShowcase title="File Tree">
              <FileTree
                items={[
                  {
                    name: "src",
                    type: "folder",
                    children: [
                      {
                        name: "components",
                        type: "folder",
                        children: [
                          { name: "Button.tsx", type: "file" },
                          { name: "Card.tsx", type: "file" },
                          { name: "index.ts", type: "file" },
                        ],
                      },
                      { name: "app", type: "folder", children: [{ name: "page.tsx", type: "file" }] },
                      { name: "globals.css", type: "file" },
                    ],
                  },
                  { name: "package.json", type: "file" },
                  { name: "tsconfig.json", type: "file" },
                ]}
              />
            </ComponentShowcase>
          </ComponentSection>

          {/* Downloads */}
          <ComponentSection
            id="downloads"
            title="Downloads"
            description="Download buttons and cards for software distribution."
          >
            <ComponentShowcase title="Download Button">
              <div className="flex flex-wrap gap-4">
                <DownloadButton
                  href="#"
                  platform="macos"
                  version="1.0.0"
                  fileSize="45 MB"
                />
                <DownloadButton
                  href="#"
                  platform="windows"
                  version="1.0.0"
                  fileSize="52 MB"
                />
                <DownloadButton
                  href="#"
                  platform="linux"
                  version="1.0.0"
                  fileSize="48 MB"
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Download Button with Progress">
              <DownloadButton
                href="#"
                platform="universal"
                version="1.0.0"
                fileSize="50 MB"
                showProgress
              />
            </ComponentShowcase>

            <ComponentShowcase title="Download Cards">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DownloadCard
                  platform="macos"
                  href="#"
                  version="1.0.0"
                  fileSize="45 MB"
                  requirements="macOS 12.0 or later"
                  recommended
                />
                <DownloadCard
                  platform="windows"
                  href="#"
                  version="1.0.0"
                  fileSize="52 MB"
                  requirements="Windows 10 or later"
                />
                <DownloadCard
                  platform="linux"
                  href="#"
                  version="1.0.0"
                  fileSize="48 MB"
                  requirements="Ubuntu 20.04, Fedora 34+"
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Download Link">
              <div className="space-y-2">
                <DownloadLink href="#" fileSize="2.5 MB">
                  Download PDF documentation
                </DownloadLink>
                <br />
                <DownloadLink href="#" fileSize="150 KB">
                  Download changelog
                </DownloadLink>
              </div>
            </ComponentShowcase>
          </ComponentSection>

          {/* Code Editor */}
          <ComponentSection
            id="code-editor"
            title="Code Editor"
            description="VS Code-style code editor with syntax highlighting, powered by Monaco Editor."
          >
            <ComponentShowcase title="CSS Editor">
              <CodeEditor
                value={`.button {
  background: #0EA5E9;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.button:hover {
  background: #0284C7;
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.4);
}`}
                language="css"
                filename="button.css"
                height={280}
                onSave={(code) => console.log("Saved:", code)}
              />
            </ComponentShowcase>

            <ComponentShowcase title="SVG Editor with Preview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CodeEditor
                  value={`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40"
    fill="#0EA5E9"
    stroke="#0284C7"
    stroke-width="2"/>
  <text x="50" y="55"
    text-anchor="middle"
    fill="white"
    font-size="14">
    SVG
  </text>
</svg>`}
                  language="svg"
                  filename="icon.svg"
                  height={240}
                />
                <div className="flex items-center justify-center p-8 bg-surface border border-border rounded-lg">
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
                    <circle cx="50" cy="50" r="40" fill="#0EA5E9" stroke="#0284C7" strokeWidth="2"/>
                    <text x="50" y="55" textAnchor="middle" fill="white" fontSize="14">SVG</text>
                  </svg>
                </div>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Read-only Mode">
              <CodeEditor
                value={`// This code is read-only
const config = {
  theme: "dark",
  language: "typescript",
  readOnly: true
};`}
                language="typescript"
                filename="config.ts"
                height={150}
                readOnly
              />
            </ComponentShowcase>

            <ComponentShowcase title="With Minimap">
              <CodeEditor
                value={`import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(\`/api/users/\${userId}\`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  return { user, loading, error };
}`}
                language="typescript"
                filename="useUser.ts"
                height={350}
                minimap
              />
            </ComponentShowcase>
          </ComponentSection>

          {/* Webflow Editor */}
          <ComponentSection
            id="webflow-editor"
            title="Webflow Editor"
            description="Webflow-style Navigator and Properties panels for visual editing interfaces."
          >
            <ComponentShowcase title="Navigator Panel">
              <div className="max-w-xs">
                <WebflowNavigator
                  nodes={sampleTreeNodes}
                  onSelect={(id, node) => console.log("Selected:", id, node)}
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Properties Panel">
              <div className="max-w-sm">
                <WebflowProperties
                  sections={samplePropertySections}
                  onChange={(fieldId, value) => console.log("Changed:", fieldId, value)}
                />
              </div>
            </ComponentShowcase>

          </ComponentSection>

          {/* Footer */}
          <footer className="mt-24 pt-8 border-t border-border">
            <p className="text-sm text-text-muted text-center">
              HSFX Design System &copy; {new Date().getFullYear()}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <Navbar />
        <StyleguideContent />
      </ToastProvider>
    </ProtectedRoute>
  );
}
