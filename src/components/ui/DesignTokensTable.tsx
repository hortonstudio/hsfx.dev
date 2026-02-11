"use client";

import { useState } from "react";

export interface DesignToken {
  name: string;
  type: "color" | "length" | "number" | "raw";
  defaultValue: string;
  variants?: Record<string, string>;
}

export interface DesignTokensTableProps {
  tokens: DesignToken[];
  highlightVariant?: string;
  className?: string;
}

function ColorSwatch({ color }: { color: string }) {
  const isTransparent = color === "transparent" || color === "none";
  const isLight = color.startsWith("#fff") || color.startsWith("#FFF") ||
                  color.includes("255, 255, 255") || color === "white";

  return (
    <span
      className={`
        inline-block w-4 h-4 rounded-full flex-shrink-0
        ${isTransparent ? "bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]" : ""}
        ${isLight ? "border border-border" : ""}
      `}
      style={!isTransparent ? { backgroundColor: color } : undefined}
      title={color}
    />
  );
}

function TokenValue({
  value,
  type,
  expanded,
  onToggle
}: {
  value: string;
  type: DesignToken["type"];
  expanded: boolean;
  onToggle: () => void;
}) {
  const isLong = value.length > 40;
  const displayValue = isLong && !expanded ? value.slice(0, 37) + "..." : value;

  return (
    <div className="flex items-center gap-2">
      {type === "color" && <ColorSwatch color={value} />}
      <code
        className={`
          text-xs font-mono text-text-secondary
          ${isLong ? "cursor-pointer hover:text-text-primary" : ""}
        `}
        onClick={isLong ? onToggle : undefined}
        title={isLong ? (expanded ? "Click to collapse" : "Click to expand") : undefined}
      >
        {displayValue}
      </code>
    </div>
  );
}

function isSystemToken(variantName: string): boolean {
  return variantName.startsWith("Theme/") || variantName.startsWith("Trigger/");
}

export function DesignTokensTable({
  tokens,
  highlightVariant,
  className = "",
}: DesignTokensTableProps) {
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const [sortAsc, setSortAsc] = useState(true);

  // Collect all unique variant names across all tokens
  const allVariants = new Set<string>();
  tokens.forEach(token => {
    if (token.variants) {
      Object.keys(token.variants).forEach(v => allVariants.add(v));
    }
  });
  const variantColumns = Array.from(allVariants).sort();

  // Sort tokens by name
  const sortedTokens = [...tokens].sort((a, b) =>
    sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );

  const toggleExpand = (key: string) => {
    setExpandedCells(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSort = () => setSortAsc(prev => !prev);

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-primary"
              onClick={toggleSort}
            >
              Token {sortAsc ? "↑" : "↓"}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              Default
            </th>
            {variantColumns.map(variant => (
              <th
                key={variant}
                className={`
                  px-4 py-3 text-left text-xs font-medium uppercase tracking-wider
                  ${isSystemToken(variant) ? "text-text-dim italic" : "text-text-muted"}
                  ${highlightVariant === variant ? "bg-accent/10" : ""}
                `}
              >
                {variant}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedTokens.map((token) => (
            <tr key={token.name} className="border-b border-border hover:bg-surface/50 transition-colors">
              <td className="px-4 py-3">
                <code className="text-xs font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                  {token.name}
                </code>
              </td>
              <td className="px-4 py-3">
                <TokenValue
                  value={token.defaultValue}
                  type={token.type}
                  expanded={expandedCells.has(`${token.name}-default`)}
                  onToggle={() => toggleExpand(`${token.name}-default`)}
                />
              </td>
              {variantColumns.map(variant => {
                const value = token.variants?.[variant];
                const cellKey = `${token.name}-${variant}`;
                return (
                  <td
                    key={variant}
                    className={`px-4 py-3 ${highlightVariant === variant ? "bg-accent/10" : ""}`}
                  >
                    {value ? (
                      <TokenValue
                        value={value}
                        type={token.type}
                        expanded={expandedCells.has(cellKey)}
                        onToggle={() => toggleExpand(cellKey)}
                      />
                    ) : (
                      <span className="text-text-dim">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {tokens.length === 0 && (
        <div className="py-12 text-center text-text-muted">No tokens defined</div>
      )}
    </div>
  );
}
