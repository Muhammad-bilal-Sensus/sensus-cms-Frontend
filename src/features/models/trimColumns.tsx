import type { TableColumn } from "@/components/ui/Table";
import { formatMoney } from "@/utils/formatMoney";
import { StatusBadge } from "./components/StatusBadge";
import { labelFor, powertrainOptions, type ModelTrim } from "./modelTypes";

export const trimColumns: TableColumn<ModelTrim>[] = [
  {
    id: "name",
    header: "Trim",
    cell: (trim) => <span className="font-medium text-slate-900">{trim.name}</span>,
  },
  {
    id: "code",
    header: "Code",
    cell: (trim) => <span className="text-slate-600">{trim.code}</span>,
  },
  {
    id: "powertrain",
    header: "Powertrain",
    cell: (trim) => <span className="text-slate-600">{labelFor(powertrainOptions, trim.powertrainType)}</span>,
  },
  {
    id: "price",
    header: "Price",
    cell: (trim) => <span className="text-slate-900">{formatMoney(trim.price, trim.currencyCode)}</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: (trim) => <StatusBadge status={trim.status} />,
  },
];
