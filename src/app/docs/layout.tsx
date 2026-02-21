"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { DocSidebar, type SidebarGroup, Spinner } from "@/components/ui";
import { DocSectionProvider, useDocSection } from "@/contexts/DocSectionContext";
import { createClient } from "@/lib/supabase/client";

// Shared sections for individual API doc pages
const apiDocSections = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "parameters", label: "Parameters" },
  { id: "responses", label: "Responses" },
  { id: "examples", label: "Examples" },
  { id: "playground", label: "Try It Out" },
];

// Static "Getting Started" + "API Reference" sections
const staticGroups: SidebarGroup[] = [
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
    label: "API Reference",
    items: [
      {
        label: "Overview",
        slug: "api",
        sections: [
          { id: "available-apis", label: "Available APIs" },
          { id: "authentication", label: "Authentication" },
          { id: "rate-limits", label: "Rate Limits" },
          { id: "download-guides", label: "Download Guides" },
        ],
      },
      { label: "CSS API", slug: "api/css", sections: apiDocSections },
      { label: "Icons API", slug: "api/icons", sections: apiDocSections },
      { label: "Button Styles API", slug: "api/button-styles", sections: apiDocSections },
    ],
  },
];

// Standard sections for component pages
const componentSections = [
  { id: "structure", label: "Structure & Properties" },
  { id: "css", label: "CSS" },
  { id: "tokens", label: "Design Tokens" },
  { id: "attributes", label: "Property-Attribute Map" },
  { id: "dependencies", label: "Dependencies" },
  { id: "usage", label: "Usage Notes" },
];

interface ComponentSummary {
  name: string;
  slug: string;
  group: string | null;
}

function getSlugFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/\/docs\/(.+)/);
  return match ? match[1] : undefined;
}

function DocsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentSlug = getSlugFromPathname(pathname);
  const { currentSection } = useDocSection();

  const [sidebarGroups, setSidebarGroups] = useState<SidebarGroup[]>(staticGroups);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComponents() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("component_docs")
        .select("name, slug, group")
        .order("group")
        .order("name");

      if (error) {
        console.error("Error fetching components for sidebar:", error);
        setLoading(false);
        return;
      }

      // Group components by their group field
      const componentsByGroup = (data as ComponentSummary[]).reduce(
        (acc, comp) => {
          const group = comp.group || "Ungrouped";
          if (!acc[group]) acc[group] = [];
          acc[group].push(comp);
          return acc;
        },
        {} as Record<string, ComponentSummary[]>
      );

      // Build sidebar groups from components
      const dynamicGroups: SidebarGroup[] = Object.keys(componentsByGroup)
        .sort()
        .map((groupName) => ({
          label: groupName,
          items: componentsByGroup[groupName].map((comp) => ({
            label: comp.name,
            slug: `components/${comp.slug}`,
            sections: componentSections,
          })),
        }));

      // Combine static groups with dynamic component groups
      setSidebarGroups([...staticGroups, ...dynamicGroups]);
      setLoading(false);
    }

    fetchComponents();
  }, []);

  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 pt-8">
          {loading ? (
            <aside className="hidden lg:flex w-64 flex-shrink-0 items-start justify-center pt-8">
              <Spinner size="sm" />
            </aside>
          ) : (
            <DocSidebar
              groups={sidebarGroups}
              currentSlug={currentSlug}
              currentSection={currentSection}
              basePath="/docs"
            />
          )}
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
