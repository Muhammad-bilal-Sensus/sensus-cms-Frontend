import type { TableColumn } from "@/components/ui/Table";
import { StatusBadge } from "./components/StatusBadge";
import { previewOems } from "./previewCatalog";
import { bodyTypeOptions, formatMoney, labelFor, type CatalogModel } from "./modelTypes";

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

export function modelColumns(onOpen: (model: CatalogModel) => void): TableColumn<CatalogModel>[] {
  return [
    {
      id: "model",
      header: "Model",
      cell: (model) => (
        <button type="button" onClick={() => onOpen(model)} className="cursor-pointer text-left">
          <span className="block font-medium text-slate-900">{model.name}</span>
          <span className="block text-xs text-slate-400">{model.slug}</span>
        </button>
      ),
    },
    {
      id: "oem",
      header: "OEM",
      cell: (model) => <span className="text-slate-600">{previewOems.find((item) => item.id === model.oemId)?.name}</span>,
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
  ];
}
