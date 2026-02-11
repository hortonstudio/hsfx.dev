"use client";

export interface PropertyMapping {
  propertyName: string;
  mapsTo: string;
  effect: string;
}

export interface PropertyAttributeMapProps {
  mappings: PropertyMapping[];
  className?: string;
}

export function PropertyAttributeMap({
  mappings,
  className = "",
}: PropertyAttributeMapProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              Property
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              Maps To
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              Effect
            </th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => (
            <tr
              key={mapping.propertyName}
              className="border-b border-border hover:bg-surface/50 transition-colors"
            >
              <td className="px-4 py-3">
                <span className="font-medium text-text-primary">
                  {mapping.propertyName}
                </span>
              </td>
              <td className="px-4 py-3">
                <code className="text-xs font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                  {mapping.mapsTo}
                </code>
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {mapping.effect}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {mappings.length === 0 && (
        <div className="py-12 text-center text-text-muted">
          No property mappings defined
        </div>
      )}
    </div>
  );
}
