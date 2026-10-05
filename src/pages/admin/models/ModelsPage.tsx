import { useEffect, useMemo, useState, type FormEvent } from "react";
import { previewModels, previewOems, specificationDefinitions } from "../../../modules/models/previewCatalog";
import {
  bodyTypeOptions,
  formatMoney,
  labelFor,
  sameKey,
  slugify,
  statusOptions,
  type CatalogModel,
  type ModelDraft,
  type ModelTrim,
  type ModelVersion,
  type PublishStatus,
  type TrimDraft,
  type VersionDraft,
} from "../../../modules/models/types";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import ModelWorkspace from "../../../components/ui/ModelWorkspace";
import Pagination from "../../../components/ui/Pagination";
import Select from "../../../components/ui/Select";
import Table, { type TableColumn } from "../../../components/ui/Table";
import { Field, StatusBadge } from "../../../components/ui/modelControls";

type Screen = { name: "list" } | { name: "create" } | { name: "model"; modelId: string };

const emptyDraft: ModelDraft = {
  oemId: previewOems[0]?.id ?? "",
  code: "",
  name: "",
  slug: "",
  bodyType: "suv",
  status: "draft",
};

function lowestPrice(model: CatalogModel) {
  const trims = model.versions.flatMap((version) => version.trims);
  if (trims.length === 0) return null;
  return trims.reduce((lowest, trim) => (trim.price < lowest.price ? trim : lowest));
}

function yearLabel(model: CatalogModel) {
  const years = model.versions.map((version) => version.modelYear);
  if (years.length === 0) return "—";
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

function modelError(draft: ModelDraft, models: CatalogModel[], ignoreId?: string) {
  if (!draft.oemId) return "Choose an OEM.";
  if (!draft.name.trim()) return "Enter a model name.";
  if (!draft.code.trim()) return "Enter a model code.";
  if (!draft.slug.trim()) return "Enter a slug.";
  const siblings = models.filter((model) => model.oemId === draft.oemId && model.id !== ignoreId);
  if (siblings.some((model) => sameKey(model.code, draft.code))) return "This code is already used for this OEM.";
  if (siblings.some((model) => sameKey(model.slug, draft.slug))) return "This slug is already used for this OEM.";
  return null;
}

function versionError(draft: VersionDraft, versions: ModelVersion[]) {
  if (!draft.code.trim()) return "Enter a version code.";
  if (!draft.name.trim()) return "Enter a version name.";
  const year = Number(draft.modelYear);
  if (!Number.isInteger(year) || year < 1980 || year > 2100) return "Enter a four-digit model year.";
  if (versions.some((version) => sameKey(version.code, draft.code))) return "This code is already used on this model.";
  return null;
}

function trimError(draft: TrimDraft, trims: ModelTrim[]) {
  if (!draft.code.trim()) return "Enter a trim code.";
  if (!draft.name.trim()) return "Enter a trim name.";
  const price = Number(draft.price);
  if (!Number.isFinite(price) || price < 0) return "Enter the current retail price.";
  if (!draft.currencyCode) return "Choose a currency.";
  if (trims.some((trim) => sameKey(trim.code, draft.code))) return "This code is already used on this version.";
  return null;
}

export default function ModelsPage() {
  const [models, setModels] = useState<CatalogModel[]>(() => structuredClone(previewModels));
  const [screen, setScreen] = useState<Screen>({ name: "list" });
  const [oemId, setOemId] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ModelDraft>(emptyDraft);
  const [createError, setCreateError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [codeEdited, setCodeEdited] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return models
      .filter((model) => {
        const oem = previewOems.find((item) => item.id === model.oemId);
        const haystack = `${model.name} ${model.code} ${model.slug} ${oem?.name ?? ""}`.toLowerCase();
        return (
          (!oemId || model.oemId === oemId) &&
          (!bodyType || model.bodyType === bodyType) &&
          (!status || model.status === status) &&
          (!needle || haystack.includes(needle))
        );
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [bodyType, models, oemId, query, status]);

  useEffect(() => {
    setPage(1);
  }, [oemId, bodyType, status, query, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleModels = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const modelColumns = useMemo<TableColumn<CatalogModel>[]>(
    () => [
      {
        id: "model",
        header: "Model",
        cell: (model) => (
          <button
            type="button"
            onClick={() => setScreen({ name: "model", modelId: model.id })}
            className="cursor-pointer text-left"
          >
            <span className="block font-medium text-slate-900">{model.name}</span>
            <span className="block text-xs text-slate-400">{model.slug}</span>
          </button>
        ),
      },
      {
        id: "oem",
        header: "OEM",
        cell: (model) => (
          <span className="text-slate-600">{previewOems.find((item) => item.id === model.oemId)?.name}</span>
        ),
      },
      {
        id: "code",
        header: "Code",
        cell: (model) => <span className="text-slate-600">{model.code}</span>,
      },
      {
        id: "body",
        header: "Body type",
        cell: (model) => <span className="text-slate-600">{labelFor(bodyTypeOptions, model.bodyType)}</span>,
      },
      {
        id: "years",
        header: "Years",
        cell: (model) => <span className="text-slate-600">{yearLabel(model)}</span>,
      },
      {
        id: "price",
        header: "From",
        cell: (model) => {
          const price = lowestPrice(model);
          return <span className="text-slate-900">{price ? formatMoney(price.price, price.currencyCode) : "—"}</span>;
        },
      },
      {
        id: "status",
        header: "Status",
        cell: (model) => <StatusBadge status={model.status} />,
      },
    ],
    [],
  );

  const selected = screen.name === "model" ? models.find((model) => model.id === screen.modelId) : undefined;

  function openCreate() {
    setDraft(emptyDraft);
    setCreateError(null);
    setSlugEdited(false);
    setCodeEdited(false);
    setScreen({ name: "create" });
  }

  function createModel(event: FormEvent) {
    event.preventDefault();
    const nextDraft = { ...draft, slug: draft.slug.trim(), code: draft.code.trim(), name: draft.name.trim() };
    const error = modelError(nextDraft, models);
    setCreateError(error);
    if (error) return;
    const id = `model-${crypto.randomUUID()}`;
    const model: CatalogModel = { id, ...nextDraft, versions: [] };
    setModels((current) => [model, ...current]);
    setScreen({ name: "model", modelId: id });
  }

  function updateModel(modelId: string, recipe: (model: CatalogModel) => CatalogModel) {
    setModels((current) => current.map((model) => (model.id === modelId ? recipe(model) : model)));
  }

  if (selected) {
    return (
      <div className="mx-auto w-full max-w-[1600px] pb-8">
        <ModelWorkspace
          key={selected.id}
          model={selected}
          oems={previewOems}
          definitions={specificationDefinitions}
          onBack={() => setScreen({ name: "list" })}
          onSaveModel={(next) => {
            const error = modelError(next, models, selected.id);
            if (error) return error;
            updateModel(selected.id, (model) => ({
              ...model,
              ...next,
              name: next.name.trim(),
              code: next.code.trim(),
              slug: next.slug.trim(),
            }));
            return null;
          }}
          onAddVersion={(next) => {
            const error = versionError(next, selected.versions);
            if (error) return error;
            const version: ModelVersion = {
              id: `ver-${crypto.randomUUID()}`,
              code: next.code.trim(),
              name: next.name.trim(),
              modelYear: Number(next.modelYear),
              status: next.status,
              contentSections: [],
              media: [],
              trims: [],
            };
            updateModel(selected.id, (model) => ({ ...model, versions: [...model.versions, version] }));
            return null;
          }}
          onAddTrim={(versionId, next) => {
            const version = selected.versions.find((item) => item.id === versionId);
            if (!version) return "Choose a version first.";
            const error = trimError(next, version.trims);
            if (error) return error;
            const trim: ModelTrim = {
              id: `trim-${crypto.randomUUID()}`,
              code: next.code.trim(),
              name: next.name.trim(),
              powertrainType: next.powertrainType,
              price: Number(next.price),
              currencyCode: next.currencyCode,
              status: next.status,
              specifications: [],
            };
            updateModel(selected.id, (model) => ({
              ...model,
              versions: model.versions.map((item) =>
                item.id === versionId ? { ...item, trims: [...item.trims, trim] } : item,
              ),
            }));
            return null;
          }}
          onChangeSection={(versionId, key, body) => {
            updateModel(selected.id, (model) => ({
              ...model,
              versions: model.versions.map((item) => {
                if (item.id !== versionId) return item;
                const existing = item.contentSections.some((section) => section.key === key);
                return {
                  ...item,
                  contentSections: existing
                    ? item.contentSections.map((section) => (section.key === key ? { ...section, body } : section))
                    : [...item.contentSections, { key, body }],
                };
              }),
            }));
          }}
          onAddMedia={(versionId, name) => {
            const version = selected.versions.find((item) => item.id === versionId);
            if (!version) return "Choose a version first.";
            if (version.media.some((asset) => asset.name.toLowerCase() === name.toLowerCase())) {
              return "This file is already linked to this version.";
            }
            updateModel(selected.id, (model) => ({
              ...model,
              versions: model.versions.map((item) =>
                item.id === versionId
                  ? { ...item, media: [...item.media, { id: `media-${crypto.randomUUID()}`, name }] }
                  : item,
              ),
            }));
            return null;
          }}
          onRemoveMedia={(versionId, mediaId) => {
            updateModel(selected.id, (model) => ({
              ...model,
              versions: model.versions.map((version) =>
                version.id === versionId
                  ? { ...version, media: version.media.filter((asset) => asset.id !== mediaId) }
                  : version,
              ),
            }));
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-8">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs text-slate-500">
            Sensus AI <span className="px-1 text-slate-300">/</span> Models
          </p>
          <h1 className="mt-1 font-brand text-2xl font-semibold text-slate-900">Models</h1>
          <p className="mt-1 text-sm text-slate-500">OEM catalog, model versions, and current trim prices.</p>
        </div>
        {screen.name === "list" ? (
          <Button variant="primary" onClick={openCreate}>New model</Button>
        ) : (
          <Button variant="secondary" onClick={() => setScreen({ name: "list" })}>Back to models</Button>
        )}
      </section>

      {screen.name === "create" ? (
        <form onSubmit={createModel} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">New model</h2>
          <p className="mt-1 text-xs text-slate-500">Code and slug must be unique inside the selected OEM.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="OEM">
              <Select
                value={draft.oemId}
                onChange={(value) => setDraft((current) => ({ ...current, oemId: value }))}
                options={previewOems.map((oem) => ({ value: oem.id, label: oem.name }))}
              />
            </Field>
            <Field label="Name">
              <Input
                value={draft.name}
                onChange={(value) => {
                  setDraft((current) => ({
                    ...current,
                    name: value,
                    slug: slugEdited ? current.slug : slugify(value),
                    code: codeEdited ? current.code : slugify(value).replace(/-/g, "").toUpperCase(),
                  }));
                }}
              />
            </Field>
            <Field label="Code">
              <Input
                value={draft.code}
                onChange={(value) => {
                  setCodeEdited(true);
                  setDraft((current) => ({ ...current, code: value.toUpperCase() }));
                }}
              />
            </Field>
            <Field label="Slug">
              <Input
                value={draft.slug}
                onChange={(value) => {
                  setSlugEdited(true);
                  setDraft((current) => ({ ...current, slug: value }));
                }}
              />
            </Field>
            <Field label="Body type">
              <Select
                value={draft.bodyType}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, bodyType: value as ModelDraft["bodyType"] }))
                }
                options={bodyTypeOptions}
              />
            </Field>
            <Field label="Status">
              <Select
                value={draft.status}
                onChange={(value) => setDraft((current) => ({ ...current, status: value as PublishStatus }))}
                options={statusOptions}
              />
            </Field>
          </div>
          {createError ? <p className="mt-3 text-sm text-rose-600">{createError}</p> : null}
          <div className="mt-4">
            <Button variant="primary" type="submit">Create model</Button>
          </div>
        </form>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Summary label="Models" value={String(filtered.length)} />
            <Summary label="Published" value={String(filtered.filter((model) => model.status === "published").length)} />
            <Summary label="Versions" value={String(filtered.reduce((sum, model) => sum + model.versions.length, 0))} />
            <Summary
              label="Trims"
              value={String(filtered.reduce((sum, model) => sum + model.versions.reduce((count, version) => count + version.trims.length, 0), 0))}
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Search">
                <Input value={query} onChange={setQuery} placeholder="Name, code, or slug" />
              </Field>
              <Field label="OEM">
                <Select
                  value={oemId}
                  onChange={setOemId}
                  placeholder="All OEMs"
                  options={previewOems.map((oem) => ({ value: oem.id, label: oem.name }))}
                />
              </Field>
              <Field label="Body type">
                <Select
                  value={bodyType}
                  onChange={setBodyType}
                  placeholder="All body types"
                  options={bodyTypeOptions}
                />
              </Field>
              <Field label="Status">
                <Select value={status} onChange={setStatus} placeholder="All statuses" options={statusOptions} />
              </Field>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <Table
              columns={modelColumns}
              rows={visibleModels}
              getRowId={(model) => model.id}
              emptyLabel="No models match these filters."
            />
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </section>
        </>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
