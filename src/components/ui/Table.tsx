import type { ReactNode } from "react";

export type TableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyLabel: string;
  onRowClick?: (row: T) => void;
  selectedRowId?: string;
};

export default function Table<T>({
  columns,
  rows,
  getRowId,
  emptyLabel,
  onRowClick,
  selectedRowId,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.id} className="px-5 py-3 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-14 text-center text-sm text-slate-500">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const rowId = getRowId(row);
              const selected = selectedRowId === rowId;
              return (
                <tr
                  key={rowId}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-t border-slate-100 ${onRowClick ? "cursor-pointer" : ""} ${
                    selected ? "bg-teal-50" : "hover:bg-slate-50"
                  }`}
                >
                  {columns.map((column) => (
                    <td key={column.id} className="px-5 py-3">
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
