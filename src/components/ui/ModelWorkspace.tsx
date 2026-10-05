import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  bodyTypeOptions,
  contentSectionOrder,
  formatMoney,
  labelFor,
  powertrainOptions,
  statusOptions,
  type CatalogModel,
  type ContentSectionKey,
  type ModelDraft,
  type Oem,
  type PublishStatus,
  type SpecificationDefinition,
  type TrimDraft,
  type VersionDraft,
} from "../../modules/models/types";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";
import Table from "./Table";
import Textarea from "./Textarea";
import TrimModal from "./TrimModal";
import { Field, StatusBadge } from "./modelControls";

type Props = {
  model: CatalogModel;
  oems: Oem[];
  definitions: SpecificationDefinition[];
  onBack: () => void;
  onSaveModel: (draft: ModelDraft) => string | null;
  onAddVersion: (draft: VersionDraft) => string | null;
  onAddTrim: (versionId: string, draft: TrimDraft) => string | null;
  onChangeSection: (versionId: string, key: ContentSectionKey, body: string) => void;
  onAddMedia: (versionId: string, name: string) => string | null;
  onRemoveMedia: (versionId: string, mediaId: string) => void;
};

const emptyVersion: VersionDraft = { code: "", name: "", modelYear: "", status: "draft" };

export default function ModelWorkspace({
  model,
  oems,
  definitions,
  onBack,
  onSaveModel,
  onAddVersion,
  onAddTrim,
  onChangeSection,
  onAddMedia,
  onRemoveMedia,
}: Props) {
  const [draft, setDraft] = useState<ModelDraft>(() => ({
    oemId: model.oemId,
    code: model.code,
    name: model.name,
    slug: model.slug,
    bodyType: model.bodyType,
    status: model.status,
  }));
  const [modelError, setModelError] = useState<string | null>(null);
  const [versionId, setVersionId] = useState(model.versions[0]?.id ?? "");
  const [trimId, setTrimId] = useState(model.versions[0]?.trims[0]?.id ?? "");
  const [showVersionForm, setShowVersionForm] = useState(model.versions.length === 0);
  const [showTrimForm, setShowTrimForm] = useState(false);
  const [versionDraft, setVersionDraft] = useState<VersionDraft>(emptyVersion);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [trimError, setTrimError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<ContentSectionKey | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (model.versions.some((item) => item.id === versionId)) return;
    const nextVersion = model.versions[model.versions.length - 1];
    setVersionId(nextVersion?.id ?? "");
    setTrimId(nextVersion?.trims[0]?.id ?? "");
  }, [model.versions, versionId]);

  const version = model.versions.find((item) => item.id === versionId) ?? model.versions[0];
  const trim = version?.trims.find((item) => item.id === trimId) ?? version?.trims[0];

  const specs = useMemo(() => {
    if (!trim) return [];
    return definitions
      .map((definition) => {
        const value = trim.specifications.find((item) => item.specificationDefinitionId === definition.id);
        return value ? { definition, value } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [definitions, trim]);

  function saveModel(event: FormEvent) {
    event.preventDefault();
    const error = onSaveModel(draft);
    setModelError(error);
  }

  function saveVersion(event: FormEvent) {
    event.preventDefault();
    const error = onAddVersion(versionDraft);
    setVersionError(error);
    if (error) return;
    setVersionDraft(emptyVersion);
    setShowVersionForm(false);
  }

  function saveTrim(draft: TrimDraft) {
    if (!version) return;
    const error = onAddTrim(version.id, draft);
    setTrimError(error);
    if (error) return;
    setShowTrimForm(false);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white px-5 py-4">
        <button type="button" onClick={onBack} className="text-xs font-medium text-teal-800 hover:underline">
          Back to models
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Sensus AI <span className="px-1 text-slate-300">/</span> Models <span className="px-1 text-slate-300">/</span> {model.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-brand text-2xl font-semibold text-slate-900">{model.name}</h1>
          <StatusBadge status={model.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          One model belongs to one OEM. Versions hold the marketing sections. Each trim keeps one current price.
        </p>
      </section>

      <form onSubmit={saveModel} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Model</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="OEM">
            <Select
              value={draft.oemId}
              onChange={(value) => setDraft((current) => ({ ...current, oemId: value }))}
              options={oems.map((oem) => ({ value: oem.id, label: oem.name }))}
            />
          </Field>
          <Field label="Name">
            <Input
              value={draft.name}
              onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
            />
          </Field>
          <Field label="Code" hint="Unique with the OEM.">
            <Input
              value={draft.code}
              onChange={(value) => setDraft((current) => ({ ...current, code: value.toUpperCase() }))}
            />
          </Field>
          <Field label="Slug" hint="Unique with the OEM.">
            <Input
              value={draft.slug}
              onChange={(value) => setDraft((current) => ({ ...current, slug: value }))}
            />
          </Field>
          <Field label="Body type">
            <Select
              value={draft.bodyType}
              onChange={(value) => setDraft((current) => ({ ...current, bodyType: value as ModelDraft["bodyType"] }))}
              options={bodyTypeOptions}
            />
          </Field>
          <Field label="Status" hint="Inactive keeps the record. Models are not deleted.">
            <Select
              value={draft.status}
              onChange={(value) => setDraft((current) => ({ ...current, status: value as PublishStatus }))}
              options={statusOptions}
            />
          </Field>
        </div>
        {modelError ? <p className="mt-3 text-sm text-rose-600">{modelError}</p> : null}
        <div className="mt-4">
          <Button variant="primary" type="submit">Save model</Button>
        </div>
      </form>

      <section className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Versions</h2>
            <button
              type="button"
              onClick={() => {
                setShowVersionForm((open) => !open);
                setVersionError(null);
              }}
              className="text-xs font-medium text-teal-800"
            >
              {showVersionForm ? "Close" : "Add version"}
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {model.versions.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No versions yet</p>
            ) : (
              model.versions.map((item) => {
                const selected = item.id === version?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setVersionId(item.id);
                      setTrimId(item.trims[0]?.id ?? "");
                      setShowTrimForm(false);
                      setTrimError(null);
                      setMediaError(null);
                      setEditingSection(null);
                    }}
                    className={`w-full rounded-lg border px-3 py-3 text-left ${
                      selected ? "border-teal-700 bg-teal-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.modelYear}</span>
                      <StatusBadge status={item.status} />
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {item.code} · {item.trims.length} {item.trims.length === 1 ? "trim" : "trims"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {showVersionForm ? (
            <form onSubmit={saveVersion} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <Field label="Code" hint="Unique on this model.">
                <Input
                  value={versionDraft.code}
                  onChange={(value) => setVersionDraft((current) => ({ ...current, code: value }))}
                />
              </Field>
              <Field label="Name">
                <Input
                  value={versionDraft.name}
                  onChange={(value) => setVersionDraft((current) => ({ ...current, name: value }))}
                />
              </Field>
              <Field label="Model year">
                <Input
                  inputMode="numeric"
                  value={versionDraft.modelYear}
                  onChange={(value) => setVersionDraft((current) => ({ ...current, modelYear: value }))}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={versionDraft.status}
                  onChange={(value) => setVersionDraft((current) => ({ ...current, status: value as PublishStatus }))}
                  options={statusOptions}
                />
              </Field>
              {versionError ? <p className="text-sm text-rose-600">{versionError}</p> : null}
              <Button variant="primary" type="submit">Add version</Button>
            </form>
          ) : null}
        </div>

        {version ? (
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{version.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Code {version.code} · Model year {version.modelYear}
                  </p>
                </div>
                <StatusBadge status={version.status} />
              </div>
              <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Content sections</h3>
              <p className="mt-1 text-xs text-slate-500">Public copy for this model year. Choose Edit to change a block.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {contentSectionOrder.map((section) => {
                  const body = version.contentSections.find((item) => item.key === section.key)?.body ?? "";
                  const editing = editingSection === section.key;
                  return (
                    <article key={section.key} className="rounded-lg border border-slate-200 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-slate-800">{section.label}</p>
                        <button
                          type="button"
                          onClick={() => setEditingSection(editing ? null : section.key)}
                          className="text-xs font-medium text-teal-800"
                        >
                          {editing ? "Done" : "Edit"}
                        </button>
                      </div>
                      {editing ? (
                        <Textarea
                          className="mt-2"
                          value={body}
                          placeholder={`Write the ${section.label.toLowerCase()}`}
                          onChange={(value) => onChangeSection(version.id, section.key, value)}
                        />
                      ) : (
                        <p className="mt-1 text-xs leading-5 text-slate-500">{body || "Empty"}</p>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Media</h3>
                  <p className="mt-1 text-xs text-slate-500">Choose an image for this version. The same file can be attached once.</p>
                </div>
                <Button variant="secondary" onClick={() => mediaInputRef.current?.click()}>Add media</Button>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setMediaError(onAddMedia(version.id, file.name));
                  }}
                />
              </div>
              {mediaError ? <p className="mt-2 text-sm text-rose-600">{mediaError}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {version.media.length === 0 ? (
                  <p className="text-xs text-slate-500">No media linked to this version.</p>
                ) : (
                  version.media.map((asset) => (
                    <span
                      key={asset.id}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                    >
                      {asset.name}
                      <button
                        type="button"
                        aria-label={`Remove ${asset.name}`}
                        onClick={() => onRemoveMedia(version.id, asset.id)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Trims</h2>
                  <p className="text-xs text-slate-500">One current retail price and currency per trim.</p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setTrimError(null);
                    setShowTrimForm(true);
                  }}
                >
                  Add trim
                </Button>
              </header>
              <Table
                columns={[
                  {
                    id: "trim",
                    header: "Trim",
                    cell: (item) => <span className="font-medium text-slate-900">{item.name}</span>,
                  },
                  {
                    id: "code",
                    header: "Code",
                    cell: (item) => <span className="text-slate-600">{item.code}</span>,
                  },
                  {
                    id: "powertrain",
                    header: "Powertrain",
                    cell: (item) => <span className="text-slate-600">{labelFor(powertrainOptions, item.powertrainType)}</span>,
                  },
                  {
                    id: "price",
                    header: "Price",
                    cell: (item) => <span className="text-slate-900">{formatMoney(item.price, item.currencyCode)}</span>,
                  },
                  {
                    id: "status",
                    header: "Status",
                    cell: (item) => <StatusBadge status={item.status} />,
                  },
                ]}
                rows={version.trims}
                getRowId={(item) => item.id}
                emptyLabel="No trims on this version"
                onRowClick={(item) => setTrimId(item.id)}
                selectedRowId={trim?.id}
              />
              <TrimModal
                open={showTrimForm}
                error={trimError}
                onClose={() => {
                  setShowTrimForm(false);
                  setTrimError(null);
                }}
                onSubmit={saveTrim}
              />
            </section>

            {trim ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">{trim.name} specifications</h2>
                <p className="mt-1 text-xs text-slate-500">One value per specification. Filterable specs can drive the public catalog.</p>
                {specs.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No specifications on this trim.</p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {specs.map(({ definition, value }) => (
                      <article key={definition.id} className="rounded-lg border border-slate-200 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">{definition.category}</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {definition.name}
                          {definition.isFilterable ? (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                              Filter
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{value.displayValue}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        ) : (
          <section className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Add a model version to enter marketing sections, media, and trims.
          </section>
        )}
      </section>
    </div>
  );
}
