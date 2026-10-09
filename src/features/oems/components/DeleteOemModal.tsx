import { useState } from "react";
import { toast } from "sonner";
import { useDeleteOemMutation } from "@/redux/api/oemApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { CmsOem } from "../oemTypes";

type DeleteOemModalProps = {
  oem: CmsOem | null;
  onClose: () => void;
};

export default function DeleteOemModal({ oem, onClose }: DeleteOemModalProps) {
  const waitForRefresh = useWaitForQueryRefresh();
  const [deleteOem, deleteMutation] = useDeleteOemMutation();
  const [refreshing, setRefreshing] = useState(false);
  const isDeleting = deleteMutation.isLoading || refreshing;

  async function submitDelete() {
    if (isDeleting) return;
    try {
      if (!oem) throw new Error("Choose an OEM to delete.");
      const message = await deleteOem(oem.id).unwrap();
      setRefreshing(true);
      toast.success(message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the OEM."));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Modal open={Boolean(oem)} title="Delete OEM" onClose={onClose} size="sm" align="center" compact hideTitle>
      <div className="flex flex-col items-center px-1 pb-1 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f4dddd] text-[#b44850]">
          <AlertIcon />
        </span>
        <h2 id="modal-title" className="mt-3 text-base font-semibold text-slate-900">
          Delete OEM
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {oem ? `Delete ${oem.name}?` : "Delete this OEM?"}
        </p>
        <p className="mt-1 text-xs text-slate-400">An OEM with microsites cannot be deleted.</p>
        <div className="mt-4 flex w-full gap-2">
          <Button variant="secondary" width="100%" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="primary" background="#b44850" width="100%" onClick={() => void submitDelete()} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.8 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}
