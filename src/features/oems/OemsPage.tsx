import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDeleteOemMutation, useGetOemsQuery } from "@/redux/api/oemApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import Button, { ButtonVariant } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import ModalBox from "@/components/ui/ModalBox";
import Select from "@/components/ui/Select";
import OemFormModal from "./components/OemFormModal";
import { oemColumns } from "./oemColumns";
import { oemStatusOptions, type CmsOem } from "./oemTypes";

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

export default function OemsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name:asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingOem, setDeletingOem] = useState<CmsOem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const waitForRefresh = useWaitForQueryRefresh();
  const [deleteOem, deleteMutation] = useDeleteOemMutation();
  const isDeleting = deleteMutation.isLoading || refreshing;
  const debouncedSearch = useDebouncedValue(search);

  async function submitDelete() {
    if (isDeleting) return;
    try {
      if (!deletingOem) throw new Error("Choose an OEM to delete.");
      const message = await deleteOem(deletingOem.id).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      setDeletingOem(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the OEM."));
    } finally {
      setRefreshing(false);
    }
  }

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

  const columns = useMemo(
    () =>
      oemColumns({
        onEdit: (oem) => {
          setEditingId(oem.id);
          setFormOpen(true);
        },
        onDelete: setDeletingOem,
      }),
    [],
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
          variant={ButtonVariant.primary}
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

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(oem) => String(oem.id)}
        emptyLabel={oemsQuery.isLoading ? "" : errorMessage ? "OEMs could not be loaded." : "No OEMs match these filters."}
        isLoading={isLoading}
        loadingLabel="Loading OEMs"
        errorMessage={errorMessage}
        pagination={{
          page: currentPage,
          pageSize: perPage,
          total,
          pageSizeOptions,
          onPageChange: setPage,
          onPageSizeChange: setPerPage,
        }}
      />

      <OemFormModal open={formOpen} oemId={editingId} onClose={closeForm} />
      <ModalBox
        open={Boolean(deletingOem)}
        title="Delete OEM"
        text={deletingOem ? `Delete ${deletingOem.name}?` : "Delete this OEM?"}
        note="An OEM with microsites cannot be deleted."
        onClose={() => setDeletingOem(null)}
        alert
        buttons={[
          { text: "Cancel", variant: ButtonVariant.secondary, onClick: () => setDeletingOem(null), disabled: isDeleting },
          {
            text: isDeleting ? "Deleting..." : "Delete",
            variant: ButtonVariant.primary,
            background: "#b44850",
            onClick: () => void submitDelete(),
            disabled: isDeleting,
          },
        ]}
      />
    </div>
  );
}
