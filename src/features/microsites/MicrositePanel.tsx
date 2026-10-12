import { useMemo, useState } from "react";
import { oemStatusLabel, oemStatusTone } from "@/features/oems/oemTypes";
import { useGetMicrositesQuery } from "@/redux/api/micrositeApi";
import { getApiErrorMessage } from "@/utils/apiError";
import Button from "@/components/ui/Button";
import Table, { type TableColumn } from "@/components/ui/Table";
import DeleteMicrositeModal from "./components/DeleteMicrositeModal";
import MicrositeFormModal from "./components/MicrositeFormModal";
import type { CmsMicrosite } from "./micrositeTypes";

type MicrositePanelProps = {
  oemId: number;
  oemName: string;
};

function StatusPill({ status }: { status: string }) {
  const tone = oemStatusTone[status as keyof typeof oemStatusTone] ?? "bg-slate-100 text-slate-500";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{oemStatusLabel(status)}</span>;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 48 56" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#d32f2f"
        fillRule="evenodd"
        d="M4 17.5h40a2.5 2.5 0 0 0 2.5-2.5v-4A2.5 2.5 0 0 0 44 8.5H31V6.2A3.2 3.2 0 0 0 27.8 3h-7.6A3.2 3.2 0 0 0 17 6.2V8.5H4A2.5 2.5 0 0 0 1.5 11v4A2.5 2.5 0 0 0 4 17.5Zm14.2-11.3h11.6a1 1 0 0 1 1 1V9H17.2V7.2a1 1 0 0 1 1-1ZM6 20h36v28.5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V20Zm7.2 6h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6h-3.2a1.6 1.6 0 0 1-1.6-1.6V27.6A1.6 1.6 0 0 1 13.2 26Zm9.2 0h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6h-3.2a1.6 1.6 0 0 1-1.6-1.6V27.6a1.6 1.6 0 0 1 1.6-1.6Zm9.2 0h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6H31.6a1.6 1.6 0 0 1-1.6-1.6V27.6a1.6 1.6 0 0 1 1.6-1.6Z"
      />
    </svg>
  );
}

export default function MicrositePanel({ oemId, oemName }: MicrositePanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<CmsMicrosite | null>(null);
  const micrositesQuery = useGetMicrositesQuery({ oemId });
  const loaded = micrositesQuery.isError ? micrositesQuery.currentData : micrositesQuery.data;
  const microsites = (loaded ?? []).filter((site) => site.oem_id === oemId);
  const errorMessage = micrositesQuery.isError ? getApiErrorMessage(micrositesQuery.error, "Could not load microsites.") : null;

  const columns = useMemo<TableColumn<CmsMicrosite>[]>(
    () => [
      { id: "name", header: "Name", cell: (site) => <span className="font-medium text-slate-900">{site.name}</span> },
      { id: "slug", header: "Slug", cell: (site) => <span className="font-mono text-xs text-slate-600">{site.slug}</span> },
      { id: "domain", header: "Domain", cell: (site) => <span className="text-slate-600">{site.domain}</span> },
      { id: "locale", header: "Locale", cell: (site) => <span className="text-slate-600">{site.settings?.locale || "—"}</span> },
      { id: "currency", header: "Currency", cell: (site) => <span className="text-slate-600">{site.settings?.currency || "—"}</span> },
      { id: "status", header: "Status", cell: (site) => <StatusPill status={site.status} /> },
      {
        id: "actions",
        header: "",
        cell: (site) => (
          <span className="flex items-center justify-end gap-1">
            <button
              type="button"
              aria-label={`Edit ${site.name}`}
              onClick={() => {
                setEditingId(site.id);
                setFormOpen(true);
              }}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              aria-label={`Delete ${site.name}`}
              onClick={() => setDeleting(site)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
            >
              <TrashIcon />
            </button>
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{oemName} microsites</p>
          <p className="text-xs text-slate-500">{microsites.length} {microsites.length === 1 ? "site" : "sites"}</p>
        </div>
        <Button
          variant="primary"
          height={34}
          onClick={() => {
            setEditingId(null);
            setFormOpen(true);
          }}
        >
          Add microsite
        </Button>
      </div>
      {errorMessage ? <p className="px-4 pt-3 text-sm text-rose-600">{errorMessage}</p> : null}
      <div className="relative min-h-24" aria-busy={micrositesQuery.isFetching}>
        <Table
          columns={columns}
          rows={microsites}
          getRowId={(site) => String(site.id)}
          emptyLabel={micrositesQuery.isLoading ? "" : errorMessage ? "Microsites could not be loaded." : "No microsites for this OEM."}
        />
        {micrositesQuery.isFetching ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
              Loading microsites
            </div>
          </div>
        ) : null}
      </div>
      <MicrositeFormModal
        open={formOpen}
        oemId={oemId}
        oemName={oemName}
        micrositeId={editingId}
        onClose={() => {
          setFormOpen(false);
          setEditingId(null);
        }}
      />
      <DeleteMicrositeModal microsite={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
