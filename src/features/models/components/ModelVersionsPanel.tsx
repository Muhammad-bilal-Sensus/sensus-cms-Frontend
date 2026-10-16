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
import { useDeleteModelVersionMutation, useGetModelVersionsQuery } from "@/redux/api/modelVersionApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import { compareText } from "@/utils/compareText";
import { versionColumns } from "../versionColumns";
import VersionFormModal from "./VersionFormModal";
import VersionTrimsPanel from "./VersionTrimsPanel";
import { modelStatusOptions, type CmsVehicleModel } from "../vehicleModelTypes";
import type { CmsModelVersion } from "../modelVersionTypes";

const pageSizeOptions = [10, 15, 25, 50];

function compareVersions(left: CmsModelVersion, right: CmsModelVersion, sort: string) {
  const [field, direction] = sort.split(":");
  const factor = direction === "desc" ? -1 : 1;
  if (field === "model_year") return (left.model_year - right.model_year) * factor;
  if (field === "created_at") {
    const leftTime = left.created_at ? Date.parse(left.created_at) : 0;
    const rightTime = right.created_at ? Date.parse(right.created_at) : 0;
    return (leftTime - rightTime) * factor;
  }
  return compareText(left.name, right.name, direction);
}

type ModelVersionsPanelProps = {
  model: CmsVehicleModel;
  oemName: string;
  onBack: () => void;
};

export default function ModelVersionsPanel({ model, oemName, onBack }: ModelVersionsPanelProps) {
  const { can } = usePermission();
  const canCreate = can("models.create");
  const canEdit = can("models.update");
  const canDelete = can("models.delete");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("model_year:desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingVersion, setDeletingVersion] = useState<CmsModelVersion | null>(null);
  const [trimsVersion, setTrimsVersion] = useState<CmsModelVersion | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const waitForRefresh = useWaitForQueryRefresh();
  const [deleteVersion, deleteMutation] = useDeleteModelVersionMutation();
  const isDeleting = deleteMutation.isLoading || refreshing;
  const debouncedSearch = useDebounce(search);
  const debouncedYear = useDebounce(year);
  const modelYear = useMemo(() => {
    const value = Number(debouncedYear);
    return /^\d{4}$/.test(debouncedYear) && value >= 1900 && value <= 2100 ? value : undefined;
  }, [debouncedYear]);

  async function submitDelete() {
    if (isDeleting || !deletingVersion) return;
    try {
      const message = await deleteVersion(deletingVersion.id).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      setDeletingVersion(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the version."));
    } finally {
      setRefreshing(false);
    }
  }

  const filterKey = `${debouncedSearch}|${modelYear ?? ""}|${status}|${sort}|${perPage}`;
  const [syncedFilterKey, setSyncedFilterKey] = useState(filterKey);
  if (syncedFilterKey !== filterKey) {
    setSyncedFilterKey(filterKey);
    setPage(1);
  }
  const requestPage = syncedFilterKey === filterKey ? page : 1;
  const versionsQuery = useGetModelVersionsQuery({
    modelId: model.id,
    status: status || undefined,
    modelYear,
  }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const loadedVersions = versionsQuery.isError ? versionsQuery.currentData : versionsQuery.data;
  const versions = (loadedVersions ?? []).filter((version) => version.model_id === model.id);
  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return versions
      .filter((version) => {
        const haystack = `${version.name} ${version.code} ${version.model_year}`.toLowerCase();
        const yearMatches = !debouncedYear || String(version.model_year).includes(debouncedYear);
        return (!needle || haystack.includes(needle)) && yearMatches;
      })
      .sort((left, right) => compareVersions(left, right, sort));
  }, [debouncedSearch, debouncedYear, sort, versions]);
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(requestPage, pageCount);
  const rows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const errorMessage = versionsQuery.isError ? getApiErrorMessage(versionsQuery.error, "Could not load versions.") : null;
  const columns = useMemo(
    () => versionColumns({
      sort,
      onSort: setSort,
      onOpenTrims: setTrimsVersion,
      onEdit: canEdit ? (version) => {
        setEditingId(version.id);
        setFormOpen(true);
      } : undefined,
      onDelete: canDelete ? setDeletingVersion : undefined,
    }),
    [canDelete, canEdit, sort],
  );

  if (trimsVersion) {
    return (
      <VersionTrimsPanel
        model={model}
        version={trimsVersion}
        onBackToVersions={() => setTrimsVersion(null)}
        onBackToModels={onBack}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <section className="rounded-lg border border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs text-slate-500">
              <button type="button" onClick={onBack} className="cursor-pointer hover:text-teal-800">Models</button>
              <span className="px-1 text-slate-300">/</span>
              {model.name}
              <span className="px-1 text-slate-300">/</span>
              Versions
            </p>
            <h1 className="mt-1 font-brand text-2xl font-semibold text-slate-900">Versions</h1>
            <p className="mt-1 text-sm text-slate-500">
              {model.name}
              {loadedVersions ? ` · ${total} ${total === 1 ? "version" : "versions"}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={ButtonVariant.secondary} onClick={onBack}>Back to models</Button>
            {canCreate ? (
              <Button
                variant={ButtonVariant.primary}
                onClick={() => {
                  setEditingId(null);
                  setFormOpen(true);
                }}
              >
                Add version
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{oemName}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{model.code}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{model.body_type || "No body type"}</span>
          <StatusBadge status={model.status} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Search">
            <Input value={search} onChange={setSearch} placeholder="Name, code, or year" />
          </Field>
          <Field label="Year">
            <Input value={year} onChange={setYear} placeholder="2026" inputMode="numeric" />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={setStatus} placeholder="All statuses" options={modelStatusOptions} />
          </Field>
        </div>
      </section>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(version) => String(version.id)}
        emptyLabel={versionsQuery.isLoading ? "" : errorMessage ? "Versions could not be loaded." : "No versions for this model yet."}
        isLoading={versionsQuery.isFetching}
        loadingLabel="Loading versions"
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

      <VersionFormModal
        open={formOpen}
        versionId={editingId}
        modelId={model.id}
        modelCode={model.code}
        onClose={() => {
          setFormOpen(false);
          setEditingId(null);
        }}
      />
      <ModalBox
        open={Boolean(deletingVersion)}
        title="Delete version"
        text={deletingVersion ? `Delete ${deletingVersion.name} ${deletingVersion.model_year}?` : "Delete this version?"}
        onClose={() => setDeletingVersion(null)}
        align={ModalAlign.center}
        alert
        buttons={[
          { text: "Cancel", variant: ButtonVariant.secondary, onClick: () => setDeletingVersion(null), disabled: isDeleting },
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
