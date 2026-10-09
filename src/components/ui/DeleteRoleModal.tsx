import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteRole, roleKeys, type CmsRole } from "../../services/roleService";
import { getApiErrorMessage } from "../../utils/apiError";
import Button from "./Button";
import Modal from "./Modal";

type DeleteRoleModalProps = {
  role: CmsRole | null;
  onClose: () => void;
};

export default function DeleteRoleModal({ role, onClose }: DeleteRoleModalProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!role) throw new Error("Choose a role to delete.");
      return deleteRole(role.id);
    },
    onSuccess: async (message) => {
      toast.success(message);
      await queryClient.invalidateQueries({ queryKey: roleKeys.all });
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not delete the role."));
    },
  });

  return (
    <Modal open={Boolean(role)} title="Delete role" onClose={onClose} size="sm" align="center" compact hideTitle>
      <div className="flex flex-col items-center px-1 pb-1 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f4dddd] text-[#b44850]">
          <AlertIcon />
        </span>
        <h2 id="modal-title" className="mt-3 text-base font-semibold text-slate-900">
          Delete role
        </h2>
        <p className="mt-1 text-sm text-slate-500">{role ? `Delete ${role.name}?` : "Delete this role?"}</p>
        <div className="mt-4 flex w-full gap-2">
          <Button variant="secondary" width="100%" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            background="#b44850"
            width="100%"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
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
