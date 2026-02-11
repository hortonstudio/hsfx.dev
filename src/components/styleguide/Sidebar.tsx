"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, X, ChevronDown, ChevronRight } from "../ui/Icons";

export interface NavItem {
  id: string;
  label: string;
  category: string;
}

export interface Category {
  id: string;
  label: string;
}

interface SidebarProps {
  items: NavItem[];
  categories: Category[];
  activeSection?: string;
  onNavigate?: (id: string) => void;
}

export function Sidebar({
  items,
  categories,
  activeSection,
  onNavigate,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategories.has(item.category);
    return matchesSearch && matchesCategory;
  });

  const groupedItems = categories
    .filter((cat) => selectedCategories.has(cat.id))
    .map((category) => ({
      ...category,
      items: filteredItems.filter((item) => item.category === category.id),
    }))
    .filter((group) => group.items.length > 0);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleNavigate = useCallback(
    (id: string) => {
      onNavigate?.(id);
      setIsMobileOpen(false);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [onNavigate]
  );

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const sidebarContent = (
    <>
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-lg
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
            transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm text-text-secondary
          hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
      >
        <span className="flex items-center gap-2">
          <Filter size={14} />
          Filter Categories
        </span>
        {isFilterOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Category Filters */}
      {isFilterOpen && (
        <div className="space-y-1 pl-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary
                hover:text-text-primary cursor-pointer rounded-lg hover:bg-surface transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCategories.has(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0"
              />
              {category.label}
            </label>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-4">
        {groupedItems.map((group) => (
          <div key={group.id}>
            <h3 className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              {group.label}
            </h3>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={`
                      w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors
                      ${
                        activeSection === item.id
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface"
                      }
                    `}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Results count */}
      {search && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-text-muted text-center">
            {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} found
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 p-3 bg-accent text-white rounded-full shadow-glow-lg
          hover:bg-accent-hover transition-colors"
        aria-label="Open navigation"
      >
        <Filter size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Navigation</h2>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface"
            >
              <X size={20} />
            </button>
          </div>
          {sidebarContent}
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-4rem)] sticky top-16 p-4 space-y-4 border-r border-border overflow-hidden">
        {sidebarContent}
      </aside>
    </>
  );
}

// Hook to track active section based on scroll position
export function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -70% 0%",
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
}
