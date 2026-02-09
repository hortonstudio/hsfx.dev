"use client";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  striped = false,
  hoverable = true,
  className = "",
}: TableProps<T>) {
  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (column.render) {
      return column.render(row);
    }
    const value = row[column.key as keyof T];
    if (value === null || value === undefined) return "-";
    return String(value);
  };

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`
                  px-4 py-3 text-left text-xs font-medium uppercase tracking-wider
                  text-text-muted
                  ${column.className || ""}
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                border-b border-border
                ${striped && rowIndex % 2 === 1 ? "bg-surface/50" : ""}
                ${hoverable ? "hover:bg-surface transition-colors" : ""}
              `}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`
                    px-4 py-3 text-sm text-text-secondary
                    ${column.className || ""}
                  `}
                >
                  {getCellValue(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-12 text-center text-text-muted">No data available</div>
      )}
    </div>
  );
}
