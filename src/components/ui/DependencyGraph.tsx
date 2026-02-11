"use client";

export interface DependencyGraphProps {
  componentName: string;
  contains: string[];
  usedBy: string[];
  onNavigate?: (name: string) => void;
  className?: string;
}

function ComponentChip({
  name,
  onClick,
}: {
  name: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        bg-green-500/10 border border-green-500/30 text-green-400
        ${onClick ? "hover:bg-green-500/20 hover:border-green-500/50 cursor-pointer" : "cursor-default"}
        transition-colors
      `}
    >
      {name}
    </button>
  );
}

function DependencySection({
  title,
  items,
  emptyMessage,
  onNavigate,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
  onNavigate?: (name: string) => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-text-primary mb-3">{title}</h4>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <ComponentChip
              key={item}
              name={item}
              onClick={onNavigate ? () => onNavigate(item) : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted italic">{emptyMessage}</p>
      )}
    </div>
  );
}

export function DependencyGraph({
  contains,
  usedBy,
  onNavigate,
  className = "",
}: DependencyGraphProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <DependencySection
        title="Contains"
        items={contains}
        emptyMessage="No sub-components (leaf component)"
        onNavigate={onNavigate}
      />
      <DependencySection
        title="Used By"
        items={usedBy}
        emptyMessage="Not used by other components (top-level)"
        onNavigate={onNavigate}
      />
    </div>
  );
}
