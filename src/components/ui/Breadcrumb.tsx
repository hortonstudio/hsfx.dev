"use client";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export function Breadcrumb({
  items,
  separator,
  className = "",
}: BreadcrumbProps) {
  const defaultSeparator = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-dim"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={`text-sm ${isLast ? "text-text-primary font-medium" : "text-text-muted"}`}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (separator || defaultSeparator)}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
