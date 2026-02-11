"use client";

import { useState, useEffect } from "react";

export interface SidebarSubItem {
  id: string;
  label: string;
}

export interface SidebarItem {
  label: string;
  slug: string;
  badge?: string;
  sections?: SidebarSubItem[];
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export interface DocSidebarProps {
  groups: SidebarGroup[];
  currentSlug?: string;
  currentSection?: string;
  basePath?: string;
  className?: string;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${expanded ? "rotate-90" : ""}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SmallChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${expanded ? "rotate-90" : ""}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SidebarItemComponent({
  item,
  isActive,
  href,
  currentSection,
  expandedItems,
  onToggleItem,
}: {
  item: SidebarItem;
  isActive: boolean;
  href: string;
  currentSection?: string;
  expandedItems: Set<string>;
  onToggleItem: (slug: string) => void;
}) {
  const hasSections = item.sections && item.sections.length > 0;
  const isExpanded = expandedItems.has(item.slug);

  return (
    <div>
      <div className="flex items-center">
        {hasSections && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleItem(item.slug);
            }}
            className="p-1 text-text-dim hover:text-text-muted transition-colors"
          >
            <SmallChevronIcon expanded={isExpanded} />
          </button>
        )}
        <a
          href={href}
          className={`
            flex-1 flex items-center justify-between px-3 py-1.5 text-sm rounded-lg
            transition-colors
            ${!hasSections ? "ml-5" : ""}
            ${isActive
              ? "bg-accent/10 text-accent font-medium"
              : "text-text-secondary hover:bg-surface hover:text-text-primary"
            }
          `}
        >
          <span>{item.label}</span>
          {item.badge && (
            <span className="text-xs text-text-dim">{item.badge}</span>
          )}
        </a>
      </div>

      {/* Sub-sections */}
      {hasSections && isExpanded && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-border pl-3">
          {item.sections!.map((section) => {
            const isSectionActive = currentSection === section.id;
            return (
              <a
                key={section.id}
                href={`${href}#${section.id}`}
                className={`
                  block px-2 py-1 text-xs rounded transition-colors
                  ${isSectionActive
                    ? "text-accent font-medium"
                    : "text-text-muted hover:text-text-primary"
                  }
                `}
              >
                {section.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  groups,
  currentSlug,
  currentSection,
  basePath = "",
  expandedGroups,
  expandedItems,
  onToggleGroup,
  onToggleItem,
}: {
  groups: SidebarGroup[];
  currentSlug?: string;
  currentSection?: string;
  basePath?: string;
  expandedGroups: Set<string>;
  expandedItems: Set<string>;
  onToggleGroup: (label: string) => void;
  onToggleItem: (slug: string) => void;
}) {
  return (
    <nav className="space-y-2">
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.label);
        const hasActiveItem = group.items.some(
          (item) => item.slug === currentSlug
        );

        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => onToggleGroup(group.label)}
              className={`
                w-full flex items-center justify-between px-3 py-2 text-sm font-medium
                rounded-lg transition-colors
                ${hasActiveItem ? "text-text-primary" : "text-text-muted"}
                hover:bg-surface hover:text-text-primary
              `}
            >
              <span>{group.label}</span>
              <ChevronIcon expanded={isExpanded} />
            </button>

            {isExpanded && (
              <div className="mt-1 ml-3 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.slug === currentSlug;
                  const href = basePath ? `${basePath}/${item.slug}` : item.slug;

                  return (
                    <SidebarItemComponent
                      key={item.slug}
                      item={item}
                      isActive={isActive}
                      href={href}
                      currentSection={currentSection}
                      expandedItems={expandedItems}
                      onToggleItem={onToggleItem}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function DocSidebar({
  groups,
  currentSlug,
  currentSection,
  basePath,
  className = "",
}: DocSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Auto-expand groups containing the active item
    const initial = new Set<string>();
    groups.forEach((group) => {
      if (group.items.some((item) => item.slug === currentSlug)) {
        initial.add(group.label);
      }
    });
    // If nothing is active, expand the first group
    if (initial.size === 0 && groups.length > 0) {
      initial.add(groups[0].label);
    }
    return initial;
  });

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // Auto-expand items that are active
    const initial = new Set<string>();
    if (currentSlug) {
      initial.add(currentSlug);
    }
    return initial;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const toggleItem = (slug: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  // Close mobile menu on route change (when currentSlug changes)
  useEffect(() => {
    setMobileOpen(false);
  }, [currentSlug]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary"
        aria-label="Open navigation"
      >
        <MenuIcon />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out panel */}
      <div
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-semibold text-text-primary">Navigation</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface"
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-65px)]" data-lenis-prevent>
          <SidebarContent
            groups={groups}
            currentSlug={currentSlug}
            currentSection={currentSection}
            basePath={basePath}
            expandedGroups={expandedGroups}
            expandedItems={expandedItems}
            onToggleGroup={toggleGroup}
            onToggleItem={toggleItem}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:block w-64 flex-shrink-0 sticky top-20 h-[calc(100vh-5rem)]
          overflow-y-auto py-4 pr-4
          ${className}
        `}
        data-lenis-prevent
      >
        <SidebarContent
          groups={groups}
          currentSlug={currentSlug}
          currentSection={currentSection}
          basePath={basePath}
          expandedGroups={expandedGroups}
          expandedItems={expandedItems}
          onToggleGroup={toggleGroup}
          onToggleItem={toggleItem}
        />
      </aside>
    </>
  );
}
