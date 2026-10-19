import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermission } from "@/access/usePermission";
import Button, { ButtonVariant } from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { ModalAlign } from "@/components/ui/Modal";
import ModalBox from "@/components/ui/ModalBox";
import Select from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Status";
import { useDeleteModelTrimMutation, useGetModelTrimsQuery } from "@/redux/api/modelTrimApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import { compareText } from "@/utils/compareText";
import { cmsTrimColumns } from "../cmsTrimColumns";
import TrimFormModal from "./TrimFormModal";
import { powertrainOptions, trimStatusOptions, type CmsModelTrim } from "../modelTrimTypes";
import type { CmsModelVersion } from "../modelVersionTypes";
import type { CmsVehicleModel } from "../vehicleModelTypes";

const pageSizeOptions = [10, 15, 25, 50];

function compareTrims(left: CmsModelTrim, right: CmsModelTrim, sort: string) {
  const [field, direction] = sort.split(":");
  const factor = direction === "desc" ? -1 : 1;
  if (field === "price") return (left.price - right.price) * factor;
  if (field === "created_at") {
    const leftTime = left.created_at ? Date.parse(left.created_at) : 0;
    const rightTime = right.created_at ? Date.parse(right.created_at) : 0;
    return (leftTime - rightTime) * factor;
  }
  return compareText(left.name, right.name, direction);
}

type VersionTrimsPanelProps = {
  model: CmsVehicleModel;
  version: CmsModelVersion;
  onBackToVersions: () => void;
  onBackToModels: () => void;
};

export default function VersionTrimsPanel({ model, version, onBackToVersions, onBackToModels }: VersionTrimsPanelProps) {
  const { can } = usePermission();
  const canCreate = can("models.create");
  const canEdit = can("models.update");
  const canDelete = can("models.delete");
  const [search, setSearch] = useState("");
  const [powertrain, setPowertrain] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name:asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingTrim, setDeletingTrim] = useState<CmsModelTrim | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const waitForRefresh = useWaitForQueryRefresh();
  const [deleteTrim, deleteMutation] = useDeleteModelTrimMutation();
  const isDeleting = deleteMutation.isLoading || refreshing;
  const debouncedSearch = useDebounce(search);

  async function submitDelete() {
    if (isDeleting || !deletingTrim) return;
    try {
      const message = await deleteTrim(deletingTrim.id).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      setDeletingTrim(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the trim."));
    } finally {
      setRefreshing(false);
    }
  }

  const filterKey = `${debouncedSearch}|${powertrain}|${status}|${sort}|${perPage}`;
  const [syncedFilterKey, setSyncedFilterKey] = useState(filterKey);
  if (syncedFilterKey !== filterKey) {
    setSyncedFilterKey(filterKey);
    setPage(1);
  }
  const requestPage = syncedFilterKey === filterKey ? page : 1;
  const trimsQuery = useGetModelTrimsQuery({
    versionId: version.id,
    status: status || undefined,
    powertrain: powertrain || undefined,
  }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const loadedTrims = trimsQuery.isError ? trimsQuery.currentData : trimsQuery.data;
  const trims = (loadedTrims ?? []).filter((trim) => trim.model_version_id === version.id);
  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return trims
      .filter((trim) => {
        const haystack = `${trim.name} ${trim.code} ${trim.powertrain_type}`.toLowerCase();
        return !needle || haystack.includes(needle);
      })
      .sort((left, right) => compareTrims(left, right, sort));
  }, [debouncedSearch, sort, trims]);
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(requestPage, pageCount);
  const rows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const errorMessage = trimsQuery.isError ? getApiErrorMessage(trimsQuery.error, "Could not load trims.") : null;
  const columns = useMemo(
    () => cmsTrimColumns({
      sort,
      onSort: setSort,
      onEdit: canEdit ? (trim) => {
        setEditingId(trim.id);
        setFormOpen(true);
      } : undefined,
      onDelete: canDelete ? setDeletingTrim : undefined,
    }),
    [canDelete, canEdit, sort],
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <section className="rounded-lg border border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs text-slate-500">
              <button type="button" onClick={onBackToModels} className="cursor-pointer hover:text-teal-800">Models</button>
              <span className="px-1 text-slate-300">/</span>
              {model.name}
              <span className="px-1 text-slate-300">/</span>
              <button type="button" onClick={onBackToVersions} className="cursor-pointer hover:text-teal-800">Variants</button>
              <span className="px-1 text-slate-300">/</span>
              Trims
            </p>
            <h1 className="mt-1 font-brand text-2xl font-semibold text-slate-900">Trims</h1>
            <p className="mt-1 text-sm text-slate-500">
              {version.name} · {version.model_year}
              {loadedTrims ? ` · ${total} ${total === 1 ? "trim" : "trims"}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={ButtonVariant.secondary} onClick={onBackToVersions}>Back to variants</Button>
            {canCreate ? (
              <Button
                variant={ButtonVariant.primary}
                onClick={() => {
                  setEditingId(null);
                  setFormOpen(true);
                }}
              >
                Add trim
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{model.name}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{version.code}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{version.model_year}</span>
          <StatusBadge status={version.status} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Search">
            <Input value={search} onChange={setSearch} placeholder="Name, code, or powertrain" />
          </Field>
          <Field label="Powertrain">
            <Select value={powertrain} onChange={setPowertrain} placeholder="All powertrains" options={powertrainOptions} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={setStatus} placeholder="All statuses" options={trimStatusOptions} />
          </Field>
        </div>
      </section>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(trim) => String(trim.id)}
        emptyLabel={trimsQuery.isLoading ? "" : errorMessage ? "Trims could not be loaded." : "No trims for this variant yet."}
        isLoading={trimsQuery.isFetching}
        loadingLabel="Loading trims"
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

      <TrimFormModal
        open={formOpen}
        trimId={editingId}
        versionId={version.id}
        versionCode={version.code}
        onClose={() => {
          setFormOpen(false);
          setEditingId(null);
        }}
      />
      <ModalBox
        open={Boolean(deletingTrim)}
        title="Delete trim"
        text={deletingTrim ? `Delete ${deletingTrim.name}?` : "Delete this trim?"}
        onClose={() => setDeletingTrim(null)}
        align={ModalAlign.center}
        alert
        buttons={[
          { text: "Cancel", variant: ButtonVariant.secondary, onClick: () => setDeletingTrim(null), disabled: isDeleting },
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
