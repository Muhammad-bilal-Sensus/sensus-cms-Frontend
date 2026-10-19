import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermission } from "@/access/usePermission";
import Button, { ButtonVariant } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import DataTable from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { ModalAlign } from "@/components/ui/Modal";
import ModalBox from "@/components/ui/ModalBox";
import Select from "@/components/ui/Select";
import { useDeleteModelMutation, useGetModelsQuery } from "@/redux/api/modelApi";
import { useGetOemsQuery } from "@/redux/api/oemApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import { compareText } from "@/utils/compareText";
import ModelVersionsPanel from "./components/ModelVersionsPanel";
import { modelColumns } from "./modelColumns";
import { modelStatusOptions, type CmsVehicleModel } from "./vehicleModelTypes";

const pageSizeOptions = [10, 15, 25, 50];

function compareModels(left: CmsVehicleModel, right: CmsVehicleModel, sort: string) {
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

export default function ModelsPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canCreate = can("models.create");
  const canEdit = can("models.update");
  const canDelete = can("models.delete");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [sort, setSort] = useState("name:asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [deletingModel, setDeletingModel] = useState<CmsVehicleModel | null>(null);
  const [versionsModel, setVersionsModel] = useState<CmsVehicleModel | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const waitForRefresh = useWaitForQueryRefresh();
  const [deleteModel, deleteMutation] = useDeleteModelMutation();
  const isDeleting = deleteMutation.isLoading || refreshing;
  const debouncedSearch = useDebounce(search);
  const oemsQuery = useGetOemsQuery();
  const queryArg = useMemo(() => ({
    status: status || undefined,
    featured: featured === "" ? undefined : featured === "1",
  }), [featured, status]);

  async function submitDelete() {
    if (isDeleting || !deletingModel) return;
    try {
      const message = await deleteModel(deletingModel.id).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      setDeletingModel(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the model."));
    } finally {
      setRefreshing(false);
    }
  }

  const filterKey = `${debouncedSearch}|${status}|${featured}|${sort}|${perPage}`;
  const [syncedFilterKey, setSyncedFilterKey] = useState(filterKey);
  if (syncedFilterKey !== filterKey) {
    setSyncedFilterKey(filterKey);
    setPage(1);
  }
  const requestPage = syncedFilterKey === filterKey ? page : 1;

  const modelsQuery = useGetModelsQuery(queryArg, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const loadedModels = modelsQuery.isError ? modelsQuery.currentData : modelsQuery.data;
  const models = loadedModels ?? [];
  const oemNames = useMemo(() => {
    const names = new Map<number, string>();
    for (const oem of oemsQuery.data ?? []) names.set(oem.id, oem.name);
    return names;
  }, [oemsQuery.data]);

  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return models
      .filter((model) => {
        const haystack = `${model.name} ${model.code} ${model.slug ?? ""} ${model.body_type}`.toLowerCase();
        return !needle || haystack.includes(needle);
      })
      .sort((left, right) => compareModels(left, right, sort));
  }, [debouncedSearch, models, sort]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(requestPage, pageCount);
  const rows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const errorMessage = modelsQuery.isError ? getApiErrorMessage(modelsQuery.error, "Could not load models.") : null;

  const columns = useMemo(
    () => modelColumns({
      sort,
      onSort: setSort,
      onOpen: setVersionsModel,
      onEdit: canEdit ? (model) => navigate(`${ROUTES.models}/${model.id}/edit`) : undefined,
      onDelete: canDelete ? setDeletingModel : undefined,
    }),
    [canDelete, canEdit, navigate, sort],
  );

  if (versionsModel) {
    return (
      <ModelVersionsPanel
        model={versionsModel}
        oemName={oemNames.get(versionsModel.oem_id) ?? "—"}
        onBack={() => setVersionsModel(null)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-slate-500">
            Sensus AI <span className="px-1 text-slate-300">/</span> Models
          </p>
          <h1 className="mt-1 font-brand text-2xl font-semibold text-slate-900">Models</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loadedModels ? `${total} ${total === 1 ? "model" : "models"}` : "Vehicle models for each OEM."}
          </p>
        </div>
        {canCreate ? (
          <Button variant={ButtonVariant.primary} onClick={() => navigate(ROUTES.modelNew)}>
            Add model
          </Button>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Search">
            <Input value={search} onChange={setSearch} placeholder="Name, code, slug, or body type" />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={setStatus} placeholder="All statuses" options={modelStatusOptions} />
          </Field>
          <Field label="Featured">
            <Select
              value={featured}
              onChange={setFeatured}
              placeholder="All models"
              options={[
                { value: "1", label: "Featured" },
                { value: "0", label: "Not featured" },
              ]}
            />
          </Field>
        </div>
      </section>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(model) => String(model.id)}
        emptyLabel={modelsQuery.isLoading ? "" : errorMessage ? "Models could not be loaded." : "No models match these filters."}
        isLoading={modelsQuery.isFetching}
        loadingLabel="Loading models"
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

      <ModalBox
        open={Boolean(deletingModel)}
        title="Delete model"
        text={deletingModel ? `Delete ${deletingModel.name}?` : "Delete this model?"}
        onClose={() => setDeletingModel(null)}
        align={ModalAlign.center}
        alert
        buttons={[
          { text: "Cancel", variant: ButtonVariant.secondary, onClick: () => setDeletingModel(null), disabled: isDeleting },
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
