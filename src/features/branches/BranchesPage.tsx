import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDeleteBranchMutation, useGetBranchesQuery } from "@/redux/api/branchApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import Button, { ButtonVariant } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import ModalBox from "@/components/ui/ModalBox";
import Select from "@/components/ui/Select";
import BranchFormModal from "./components/BranchFormModal";
import { branchColumns } from "./branchColumns";
import { StatusSelect } from "@/components/ui/Status";
import type { CmsBranch } from "./branchTypes";

const pageSizeOptions = [10, 15, 25, 50];

const sortOptions = [
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "code:asc", label: "Code A–Z" },
  { value: "code:desc", label: "Code Z–A" },
  { value: "city:asc", label: "City A–Z" },
  { value: "city:desc", label: "City Z–A" },
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

function compareBranches(left: CmsBranch, right: CmsBranch, sort: string) {
  const [field, direction] = sort.split(":");
  if (field === "code") return compareText(left.code, right.code, direction);
  if (field === "city") return compareText(left.city, right.city, direction);
  if (field === "created_at") {
    const leftTime = left.created_at ? Date.parse(left.created_at) : 0;
    const rightTime = right.created_at ? Date.parse(right.created_at) : 0;
    const factor = direction === "desc" ? -1 : 1;
    return (leftTime - rightTime) * factor;
  }
  return compareText(left.name, right.name, direction);
}

export default function BranchesPage() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name:asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<CmsBranch | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const waitForRefresh = useWaitForQueryRefresh();
  const [deleteBranch, deleteMutation] = useDeleteBranchMutation();
  const isDeleting = deleteMutation.isLoading || refreshing;
  const debouncedSearch = useDebouncedValue(search);
  const debouncedCity = useDebouncedValue(city);

  async function submitDelete() {
    if (isDeleting) return;
    try {
      if (!deletingBranch) throw new Error("Choose a branch to delete.");
      const message = await deleteBranch(deletingBranch.id).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      setDeletingBranch(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the branch."));
    } finally {
      setRefreshing(false);
    }
  }

  const filterKey = `${debouncedSearch}|${debouncedCity}|${status}|${sort}|${perPage}`;
  const [syncedFilterKey, setSyncedFilterKey] = useState(filterKey);
  if (syncedFilterKey !== filterKey) {
    setSyncedFilterKey(filterKey);
    setPage(1);
  }
  const requestPage = syncedFilterKey === filterKey ? page : 1;

  const branchesQuery = useGetBranchesQuery(
    { city: debouncedCity, status },
    { refetchOnMountOrArgChange: true, refetchOnFocus: true, refetchOnReconnect: true },
  );

  const loadedBranches = branchesQuery.isError ? branchesQuery.currentData : branchesQuery.data;
  const branches = loadedBranches ?? [];
  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    const cityNeedle = debouncedCity.trim().toLowerCase();
    return branches
      .filter((branch) => {
        const haystack = `${branch.name} ${branch.code} ${branch.city} ${branch.phone ?? ""}`.toLowerCase();
        const matchesSearch = !needle || haystack.includes(needle);
        const matchesCity = !cityNeedle || branch.city.toLowerCase().includes(cityNeedle);
        const matchesStatus = !status || branch.status === status;
        return matchesSearch && matchesCity && matchesStatus;
      })
      .sort((left, right) => compareBranches(left, right, sort));
  }, [branches, debouncedCity, debouncedSearch, sort, status]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(requestPage, pageCount);
  const rows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const isLoading = branchesQuery.isFetching;
  const errorMessage = branchesQuery.isError ? getApiErrorMessage(branchesQuery.error, "Could not load branches.") : null;

  const columns = useMemo(
    () =>
      branchColumns({
        onEdit: (branch) => {
          setEditingId(branch.id);
          setFormOpen(true);
        },
        onDelete: setDeletingBranch,
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
            Sensus AI <span className="px-1 text-slate-300">/</span> Branches
          </p>
          <h1 className="mt-1 font-brand text-2xl font-semibold text-slate-900">Branches</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loadedBranches ? `${total} ${total === 1 ? "branch" : "branches"}` : "Service and showroom branches."}
          </p>
        </div>
        <Button
          variant={ButtonVariant.primary}
          onClick={() => {
            setEditingId(null);
            setFormOpen(true);
          }}
        >
          Add branch
        </Button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Search
            <Input value={search} onChange={setSearch} placeholder="Name, code, city, or phone" />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            City
            <Input value={city} onChange={setCity} placeholder="Filter by city" />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Status
            <StatusSelect value={status} onChange={setStatus} placeholder="All statuses" />
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
        getRowId={(branch) => String(branch.id)}
        emptyLabel={branchesQuery.isLoading ? "" : errorMessage ? "Branches could not be loaded." : "No branches match these filters."}
        isLoading={isLoading}
        loadingLabel="Loading branches"
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

      <BranchFormModal open={formOpen} branchId={editingId} onClose={closeForm} />
      <ModalBox
        open={Boolean(deletingBranch)}
        title="Delete branch"
        text={deletingBranch ? `Delete ${deletingBranch.name}?` : "Delete this branch?"}
        note="A branch linked to a microsite cannot be deleted."
        onClose={() => setDeletingBranch(null)}
        alert
        buttons={[
          { text: "Cancel", variant: ButtonVariant.secondary, onClick: () => setDeletingBranch(null), disabled: isDeleting },
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
