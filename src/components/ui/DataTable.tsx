import Loading from "./Loading";
import Pagination from "./Pagination";
import Table, { type TableColumn } from "./Table";

export type { TableColumn };

export type DataTablePagination = {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

type DataTableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyLabel: string;
  isLoading?: boolean;
  loadingLabel?: string;
  errorMessage?: string | null;
  pagination?: DataTablePagination;
  onRowClick?: (row: T) => void;
  selectedRowId?: string;
};

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyLabel,
  isLoading = false,
  loadingLabel = "Loading",
  errorMessage,
  pagination,
  onRowClick,
  selectedRowId,
}: DataTableProps<T>) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {errorMessage ? <p className="px-5 pt-4 text-sm text-rose-600">{errorMessage}</p> : null}
      <div className="relative min-h-40" aria-busy={isLoading}>
        <div className={isLoading ? "pointer-events-none opacity-50" : undefined}>
          <Table
            columns={columns}
            rows={rows}
            getRowId={getRowId}
            emptyLabel={emptyLabel}
            onRowClick={onRowClick}
            selectedRowId={selectedRowId}
          />
        </div>
        {isLoading ? <Loading label={loadingLabel} overlay /> : null}
      </div>
      {pagination ? (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      ) : null}
    </section>
  );
}
