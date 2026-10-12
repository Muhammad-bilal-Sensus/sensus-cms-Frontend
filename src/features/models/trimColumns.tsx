import type { TableColumn } from "@/components/ui/Table";
import { StatusBadge } from "./components/StatusBadge";
import { formatMoney, labelFor, powertrainOptions, type ModelTrim } from "./modelTypes";

export const trimColumns: TableColumn<ModelTrim>[] = [
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
];
