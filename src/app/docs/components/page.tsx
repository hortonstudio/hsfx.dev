"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Breadcrumb, Spinner, Badge } from "@/components/ui";

interface ComponentSummary {
  id: string;
  name: string;
  slug: string;
  group: string | null;
  description: string | null;
}

const breadcrumbItems = [
  { label: "Docs", href: "/docs" },
  { label: "Components" },
];

export default function ComponentsIndexPage() {
  const [components, setComponents] = useState<ComponentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComponents() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("component_docs")
        .select("id, name, slug, group, description")
        .order("group")
        .order("name");

      if (error) {
        console.error("Error fetching components:", error);
        setLoading(false);
        return;
      }

      setComponents(data || []);
      setLoading(false);
    }

    fetchComponents();
  }, []);

  // Group components by their group field
  const groupedComponents = components.reduce(
    (acc, comp) => {
      const group = comp.group || "Ungrouped";
      if (!acc[group]) acc[group] = [];
      acc[group].push(comp);
      return acc;
    },
    {} as Record<string, ComponentSummary[]>
  );

  const sortedGroups = Object.keys(groupedComponents).sort();

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Title */}
      <div>
        <h1 className="font-serif text-4xl font-bold text-text-primary mb-4">
          Components
        </h1>
        <p className="text-lg text-text-secondary max-w-3xl">
          Browse all available HSFX components. Each component includes structure documentation, CSS, design tokens, and usage notes.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!loading && components.length === 0 && (
        <div className="text-center py-20 border border-border rounded-lg">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="font-serif text-xl font-bold text-text-primary mb-2">
            No components yet
          </h3>
          <p className="text-text-muted max-w-md mx-auto">
            Component documentation will appear here once generated using the{" "}
            <Link href="/tools/doc-generator" className="text-accent hover:text-accent-hover">
              Doc Generator
            </Link>{" "}
            tool.
          </p>
        </div>
      )}

      {/* Component Groups */}
      {!loading && components.length > 0 && (
        <div className="space-y-10">
          {sortedGroups.map((group) => (
            <section key={group}>
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
                {group}
                <Badge variant="default">{groupedComponents[group].length}</Badge>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedComponents[group].map((comp) => (
                  <Link
                    key={comp.id}
                    href={`/docs/components/${comp.slug}`}
                    className="group block p-4 border border-border rounded-lg hover:border-accent/50 hover:bg-surface/50 transition-all"
                  >
                    <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors mb-1">
                      {comp.name}
                    </h3>
                    {comp.description && (
                      <p className="text-sm text-text-muted line-clamp-2">
                        {comp.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && components.length > 0 && (
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-text-muted">
            {components.length} components across {sortedGroups.length} groups
          </p>
        </div>
      )}
    </div>
  );
}
