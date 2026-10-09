import { useEffect, useMemo, useState } from "react";
import { useGetOemsQuery } from "@/redux/api/oemApi";
import { usePermission } from "@/access/usePermission";
import { getApiErrorMessage } from "@/utils/apiError";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Table, { type TableColumn } from "@/components/ui/Table";
import DeleteOemModal from "./components/DeleteOemModal";
import OemFormModal from "./components/OemFormModal";
import { oemStatusLabel, oemStatusOptions, oemStatusTone, type CmsOem } from "./oemTypes";

const pageSizeOptions = [10, 15, 25, 50];

const sortOptions = [
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "code:asc", label: "Code A–Z" },
  { value: "code:desc", label: "Code Z–A" },
  { value: "created_at:desc", label: "Newest first" },
  { value: "created_at:asc", label: "Oldest first" },
];

function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function compareText(left: string, right: string, direction: string) {
  const factor = direction === "desc" ? -1 : 1;
  return left.localeCompare(right) * factor;
}

function compareOems(left: CmsOem, right: CmsOem, sort: string) {
  const [field, direction] = sort.split(":");
  if (field === "code") return compareText(left.code, right.code, direction);
  if (field === "created_at") {
    const leftTime = left.created_at ? Date.parse(left.created_at) : 0;
    const rightTime = right.created_at ? Date.parse(right.created_at) : 0;
    const factor = direction === "desc" ? -1 : 1;
    return (leftTime - rightTime) * factor;
  }
  return compareText(left.name, right.name, direction);
}

function StatusPill({ status }: { status: string }) {
  const tone = oemStatusTone[status as keyof typeof oemStatusTone] ?? "bg-slate-100 text-slate-500";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{oemStatusLabel(status)}</span>;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 48 56" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#d32f2f"
        fillRule="evenodd"
        d="M4 17.5h40a2.5 2.5 0 0 0 2.5-2.5v-4A2.5 2.5 0 0 0 44 8.5H31V6.2A3.2 3.2 0 0 0 27.8 3h-7.6A3.2 3.2 0 0 0 17 6.2V8.5H4A2.5 2.5 0 0 0 1.5 11v4A2.5 2.5 0 0 0 4 17.5Zm14.2-11.3h11.6a1 1 0 0 1 1 1V9H17.2V7.2a1 1 0 0 1 1-1ZM6 20h36v28.5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V20Zm7.2 6h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6h-3.2a1.6 1.6 0 0 1-1.6-1.6V27.6A1.6 1.6 0 0 1 13.2 26Zm9.2 0h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6h-3.2a1.6 1.6 0 0 1-1.6-1.6V27.6a1.6 1.6 0 0 1 1.6-1.6Zm9.2 0h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6H31.6a1.6 1.6 0 0 1-1.6-1.6V27.6a1.6 1.6 0 0 1 1.6-1.6Z"
      />
    </svg>
  );
}

export default function OemsPage() {
  const { can } = usePermission();
  const canUpdate = can("oems.update");
  const canDelete = can("oems.delete");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name:asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingOem, setDeletingOem] = useState<CmsOem | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const filterKey = `${debouncedSearch}|${status}|${sort}|${perPage}`;
  const [syncedFilterKey, setSyncedFilterKey] = useState(filterKey);
  if (syncedFilterKey !== filterKey) {
    setSyncedFilterKey(filterKey);
    setPage(1);
  }
  const requestPage = syncedFilterKey === filterKey ? page : 1;

  const oemsQuery = useGetOemsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const loadedOems = oemsQuery.isError ? oemsQuery.currentData : oemsQuery.data;
  const oems = loadedOems ?? [];
  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return oems
      .filter((oem) => {
        const haystack = `${oem.name} ${oem.code} ${oem.description ?? ""}`.toLowerCase();
        return (!needle || haystack.includes(needle)) && (!status || oem.status === status);
      })
      .sort((left, right) => compareOems(left, right, sort));
  }, [debouncedSearch, oems, sort, status]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(requestPage, pageCount);
  const rows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const isLoading = oemsQuery.isFetching;
  const errorMessage = oemsQuery.isError ? getApiErrorMessage(oemsQuery.error, "Could not load OEMs.") : null;

  const columns = useMemo<TableColumn<CmsOem>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (oem) => <span className="font-medium text-slate-900">{oem.name}</span>,
      },
      {
        id: "code",
        header: "Code",
        cell: (oem) => <span className="font-mono text-xs text-slate-600">{oem.code}</span>,
      },
      {
        id: "description",
        header: "Description",
        cell: (oem) => (
          <span className="block max-w-md truncate text-slate-600" title={oem.description ?? undefined}>
            {oem.description?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (oem) => <StatusPill status={oem.status} />,
      },
      {
        id: "created",
        header: "Created",
        cell: (oem) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(oem.created_at)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: (oem) => {
          // if (!canUpdate && !canDelete) return null;
          return (
            <span className="flex items-center justify-end gap-1">
              {/* {canUpdate ? ( */}
                <button
                  type="button"
                  aria-label={`Edit ${oem.name}`}
                  onClick={() => {
                    setEditingId(oem.id);
                    setFormOpen(true);
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
                >
                  <PencilIcon />
                </button>
              {/* ) : null} */}
              {/* {canDelete ? ( */}
                <button
                  type="button"
                  aria-label={`Delete ${oem.name}`}
                  onClick={() => setDeletingOem(oem)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
                >
                  <TrashIcon />
                </button>
              {/* ) : null} */}
            </span>
          );
        },
      },
    ],
    [canDelete, canUpdate],
  );

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-slate-500">
            Sensus AI <span className="px-1 text-slate-300">/</span> OEMs
          </p>
          <h1 className="mt-1 font-brand text-2xl font-semibold text-slate-900">OEMs</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loadedOems ? `${total} ${total === 1 ? "OEM" : "OEMs"}` : "Manufacturers used by models and microsites."}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingId(null);
            setFormOpen(true);
          }}
        >
          Add OEM
        </Button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Search
            <Input value={search} onChange={setSearch} placeholder="Name, code, or description" />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Status
            <Select value={status} onChange={setStatus} placeholder="All statuses" options={oemStatusOptions} />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Sort
            <Select value={sort} onChange={setSort} options={sortOptions} />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {errorMessage ? <p className="px-5 pt-4 text-sm text-rose-600">{errorMessage}</p> : null}
        <div className="relative min-h-40" aria-busy={isLoading}>
          <div className={isLoading ? "pointer-events-none opacity-50" : undefined}>
            <Table
              columns={columns}
              rows={rows}
              getRowId={(oem) => String(oem.id)}
              emptyLabel={oemsQuery.isLoading ? "" : errorMessage ? "OEMs could not be loaded." : "No OEMs match these filters."}
            />
          </div>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
                Loading OEMs
              </div>
            </div>
          ) : null}
        </div>
        <Pagination
          page={currentPage}
          pageSize={perPage}
          total={total}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={setPerPage}
        />
      </section>

      <OemFormModal open={formOpen} oemId={editingId} onClose={closeForm} />
      <DeleteOemModal oem={deletingOem} onClose={() => setDeletingOem(null)} />
    </div>
  );
}
