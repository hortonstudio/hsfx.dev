"use client";

export interface VariantOption {
  label: string;
  value: string;
}

export interface VariantSelector {
  label: string;
  options: VariantOption[];
}

export interface ComponentHeaderProps {
  name: string;
  group: string | null;
  description: string | null;
  variants?: VariantSelector[];
  selectedVariants?: Record<string, string>;
  onVariantChange?: (label: string, value: string) => void;
  className?: string;
}

function VariantSwitcher({
  selector,
  selectedValue,
  onChange,
}: {
  selector: VariantSelector;
  selectedValue?: string;
  onChange?: (value: string) => void;
}) {
  const currentValue = selectedValue || selector.options[0]?.value;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
        {selector.label}
      </span>
      <div className="inline-flex rounded-lg bg-surface border border-border p-1 gap-1">
        {selector.options.map((option) => {
          const isSelected = currentValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange?.(option.value)}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-all duration-150
                ${isSelected
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-border/50"
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ComponentHeader({
  name,
  group,
  description,
  variants,
  selectedVariants,
  onVariantChange,
  className = "",
}: ComponentHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Group breadcrumb/badge */}
      {group && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface border border-border text-text-muted">
          {group}
        </span>
      )}

      {/* Component name */}
      <h1 className="font-serif text-4xl font-bold text-text-primary">{name}</h1>

      {/* Description */}
      {description && (
        <p className="text-lg text-text-secondary max-w-3xl">{description}</p>
      )}

      {/* Variant selectors */}
      {variants && variants.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap gap-6">
            {variants.map((selector) => (
              <VariantSwitcher
                key={selector.label}
                selector={selector}
                selectedValue={selectedVariants?.[selector.label]}
                onChange={
                  onVariantChange
                    ? (value) => onVariantChange(selector.label, value)
                    : undefined
                }
              />
            ))}
          </div>
          <p className="text-xs text-text-dim">
            Select a variant to highlight its values in the design tokens table below.
          </p>
        </div>
      )}
    </div>
  );
}
