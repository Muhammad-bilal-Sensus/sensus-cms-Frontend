import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDeleteMicrositeMutation, useGetMicrositesQuery } from "@/redux/api/micrositeApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import ModalBox from "@/components/ui/ModalBox";
import Table from "@/components/ui/Table";
import MicrositeFormModal from "./components/MicrositeFormModal";
import { micrositeColumns } from "./micrositeColumns";
import type { CmsMicrosite } from "./micrositeTypes";

type MicrositePanelProps = {
  oemId: number;
  oemName: string;
};

export default function MicrositePanel({ oemId, oemName }: MicrositePanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<CmsMicrosite | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const waitForRefresh = useWaitForQueryRefresh();
  const [deleteMicrosite, deleteMutation] = useDeleteMicrositeMutation();
  const isDeleting = deleteMutation.isLoading || refreshing;
  const micrositesQuery = useGetMicrositesQuery({ oemId });
  const loaded = micrositesQuery.isError ? micrositesQuery.currentData : micrositesQuery.data;
  const microsites = (loaded ?? []).filter((site) => site.oem_id === oemId);
  const errorMessage = micrositesQuery.isError ? getApiErrorMessage(micrositesQuery.error, "Could not load microsites.") : null;

  async function submitDelete() {
    if (isDeleting) return;
    try {
      if (!deleting) throw new Error("Choose a microsite to delete.");
      const message = await deleteMicrosite(deleting.id).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      setDeleting(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the microsite."));
    } finally {
      setRefreshing(false);
    }
  }

  const columns = useMemo(
    () =>
      micrositeColumns({
        onEdit: (site) => {
          setEditingId(site.id);
          setFormOpen(true);
        },
        onDelete: setDeleting,
      }),
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
        {micrositesQuery.isFetching ? <Loading label="Loading microsites" overlay /> : null}
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
      <ModalBox
        open={Boolean(deleting)}
        title="Delete microsite"
        text={deleting ? `Delete ${deleting.name}?` : "Delete this microsite?"}
        onClose={() => setDeleting(null)}
        alert
        buttons={[
          { text: "Cancel", variant: "secondary", onClick: () => setDeleting(null), disabled: isDeleting },
          {
            text: isDeleting ? "Deleting..." : "Delete",
            variant: "primary",
            background: "#b44850",
            onClick: () => void submitDelete(),
            disabled: isDeleting,
          },
        ]}
      />
    </div>
  );
}
