import { Fragment, type ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
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
  expandLabel?: (row: T, expanded: boolean) => string;
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
  expandLabel,
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
                const canExpand = Boolean(renderExpanded && onRowClick);
                const expanded = Boolean(canExpand && expandedRowId === rowId);
                const panelId = `row-details-${rowId}`;
                return (
                  <Fragment key={rowId}>
                    <tr
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`border-t border-slate-100 ${onRowClick ? "cursor-pointer" : ""} ${
                        selected ? "bg-teal-50" : "hover:bg-slate-50"
                      }`}
                    >
                      {columns.map((column, index) => (
                        <td key={column.id} className="px-5 py-3">
                          {index === 0 && canExpand ? (
                            <span className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-expanded={expanded}
                                aria-controls={panelId}
                                aria-label={expandLabel?.(row, expanded) ?? (expanded ? "Collapse row" : "Expand row")}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onRowClick?.(row);
                                }}
                                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                              >
                                <Icon
                                  name="chevronRight"
                                  className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                                />
                              </button>
                              {column.cell(row)}
                            </span>
                          ) : (
                            column.cell(row)
                          )}
                        </td>
                      ))}
                    </tr>
                    {expanded && renderExpanded ? (
                      <tr className="border-t border-slate-100 bg-slate-50">
                        <td id={panelId} colSpan={columns.length} className="px-5 py-4">
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
