import { Fragment, type ReactNode } from "react";
import Loading from "./Loading";

export type TableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyLabel: string;
  onRowClick?: (row: T) => void;
  selectedRowId?: string;
  expandedRowId?: string | null;
  renderExpanded?: (row: T) => ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
};

export default function Table<T>({
  columns,
  rows,
  getRowId,
  emptyLabel,
  onRowClick,
  selectedRowId,
  expandedRowId,
  renderExpanded,
  isLoading = false,
  loadingLabel = "Loading",
}: TableProps<T>) {
  return (
    <div className="relative">
      <div className={`overflow-x-auto ${isLoading ? "pointer-events-none opacity-50" : ""}`}>
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
                const expanded = expandedRowId === rowId && renderExpanded;
                return (
                  <Fragment key={rowId}>
                    <tr
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      aria-expanded={expanded ? true : undefined}
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
                    {expanded ? (
                      <tr className="border-t border-slate-100 bg-slate-50">
                        <td colSpan={columns.length} className="px-5 py-4">
                          {renderExpanded(row)}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {isLoading ? <Loading label={loadingLabel} overlay /> : null}
    </div>
  );
}
