"use client";

import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { DocSidebar, type SidebarGroup } from "@/components/ui";
import { DocSectionProvider, useDocSection } from "@/contexts/DocSectionContext";

const sidebarGroups: SidebarGroup[] = [
  {
    label: "Getting Started",
    items: [
      {
        label: "Introduction",
        slug: "getting-started",
        sections: [
          { id: "introduction", label: "Introduction" },
          { id: "setting-up", label: "Setting up" },
          { id: "first-page", label: "First page" },
          { id: "components", label: "Components" },
          { id: "next-steps", label: "Next steps" },
        ],
      },
      { label: "Installation", slug: "installation" },
      { label: "Building Your First Page", slug: "first-page" },
    ],
  },
  {
    label: "Button",
    items: [
      {
        label: "Button Main",
        slug: "components/button-main",
        badge: "5 variants",
        sections: [
          { id: "structure", label: "Structure & Properties" },
          { id: "css", label: "CSS" },
          { id: "tokens", label: "Design Tokens" },
          { id: "attributes", label: "Property-Attribute Map" },
          { id: "dependencies", label: "Dependencies" },
          { id: "usage", label: "Usage Notes" },
        ],
      },
      { label: "Button Arrow", slug: "components/button-arrow" },
      { label: "Button Icon", slug: "components/button-icon" },
    ],
  },
  {
    label: "Layout",
    items: [
      { label: "Section", slug: "components/section" },
      { label: "Container", slug: "components/container" },
      { label: "Grid", slug: "components/grid" },
    ],
  },
  {
    label: "Typography",
    items: [
      { label: "Heading", slug: "components/heading" },
      { label: "Paragraph", slug: "components/paragraph" },
      { label: "Rich Text", slug: "components/rich-text" },
    ],
  },
  {
    label: "Forms",
    items: [
      { label: "Input", slug: "components/input" },
      { label: "Select", slug: "components/select" },
      { label: "Checkbox", slug: "components/checkbox" },
    ],
  },
];

function getSlugFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/\/docs\/(.+)/);
  return match ? match[1] : undefined;
}

function DocsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentSlug = getSlugFromPathname(pathname);
  const { currentSection } = useDocSection();

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 pt-8">
          <DocSidebar
            groups={sidebarGroups}
            currentSlug={currentSlug}
            currentSection={currentSection}
            basePath="/docs"
          />
          <main className="flex-1 min-w-0 pb-16 lg:pl-4">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <Navbar />
      <DocSectionProvider>
        <DocsLayoutContent>{children}</DocsLayoutContent>
      </DocSectionProvider>
    </ProtectedRoute>
  );
}
