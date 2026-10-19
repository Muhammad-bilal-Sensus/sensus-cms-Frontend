import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGetBranchesQuery } from "@/redux/api/branchApi";
import { useGetMicrositeBranchesQuery, useSyncMicrositeBranchesMutation } from "@/redux/api/micrositeApi";
import { useWaitForQueryRefresh } from "@/redux/store/queryRefresh";
import { getApiErrorMessage } from "@/utils/apiError";
import Button, { ButtonVariant } from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import ModalBox from "@/components/ui/ModalBox";
import { ModalAlign, ModalSize } from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import type { CmsBranch } from "@/features/branches/branchTypes";
import type { CmsMicrosite, MicrositeBranchLink, MicrositeBranchLinkStatus } from "../micrositeTypes";
import CapabilityCheck from "./CapabilityCheck";

type SyncRow = {
  branchId: number;
  name: string;
  code: string;
  city: string;
  included: boolean;
  supportsSales: boolean;
  supportsService: boolean;
  supportsTestDrive: boolean;
  sortOrder: number | null;
  status: MicrositeBranchLinkStatus;
};

const linkStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

type MicrositeBranchSyncModalProps = {
  open: boolean;
  microsite: CmsMicrosite;
  onClose: () => void;
};

function buildRows(branches: CmsBranch[], links: MicrositeBranchLink[]): SyncRow[] {
  const linksByBranch = new Map(links.map((link) => [link.branch_id, link]));
  return branches.map((branch) => {
    const link = linksByBranch.get(branch.id);
    return {
      branchId: branch.id,
      name: branch.name,
      code: branch.code,
      city: branch.city,
      included: Boolean(link),
      supportsSales: link?.supports_sales ?? false,
      supportsService: link?.supports_service ?? false,
      supportsTestDrive: link?.supports_test_drive ?? false,
      sortOrder: link ? link.sort_order : null,
      status: link?.status ?? "active",
    };
  });
}

function toPayload(rows: SyncRow[]): MicrositeBranchLink[] {
  const included = rows.filter((row) => row.included);
  const saved = included
    .filter((row) => row.sortOrder !== null)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
  const added = included.filter((row) => row.sortOrder === null);
  let nextOrder = saved.reduce((max, row) => Math.max(max, row.sortOrder ?? 0), 0) + 1;
  return [...saved, ...added].map((row) => ({
    branch_id: row.branchId,
    supports_sales: row.supportsSales,
    supports_service: row.supportsService,
    supports_test_drive: row.supportsTestDrive,
    sort_order: row.sortOrder ?? nextOrder++,
    status: row.status,
  }));
}

export default function MicrositeBranchSyncModal({ open, microsite, onClose }: MicrositeBranchSyncModalProps) {
  const [rows, setRows] = useState<SyncRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const seededFor = useRef<number | null>(null);
  const waitForRefresh = useWaitForQueryRefresh();
  const branchesQuery = useGetBranchesQuery({}, { skip: !open });
  const linksQuery = useGetMicrositeBranchesQuery(microsite.id, { skip: !open, refetchOnMountOrArgChange: true });
  const [syncBranches, syncMutation] = useSyncMicrositeBranchesMutation();
  const saving = syncMutation.isLoading || refreshing;
  const canSave = Boolean(rows) && branchesQuery.isSuccess && linksQuery.isSuccess && !saving;

  useEffect(() => {
    if (!open) {
      seededFor.current = null;
      setRows(null);
      return;
    }
    if (seededFor.current === microsite.id) return;
    if (!branchesQuery.isSuccess || !branchesQuery.data) return;
    if (!linksQuery.isSuccess || !linksQuery.data || linksQuery.isFetching) return;
    seededFor.current = microsite.id;
    setRows(buildRows(branchesQuery.data, linksQuery.data));
  }, [
    open,
    microsite.id,
    branchesQuery.isSuccess,
    branchesQuery.data,
    linksQuery.isFetching,
    linksQuery.isSuccess,
    linksQuery.data,
  ]);

  function updateRow(branchId: number, patch: Partial<SyncRow>) {
    setRows((current) => current?.map((row) => row.branchId === branchId ? { ...row, ...patch } : row) ?? null);
  }

  async function submit() {
    if (!canSave || !rows) return;
    try {
      const result = await syncBranches({ micrositeId: microsite.id, branches: toPayload(rows) }).unwrap();
      setRefreshing(true);
      toast.success(result.message);
      await waitForRefresh();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not sync locations."));
    } finally {
      setRefreshing(false);
    }
  }

  const branchesError = branchesQuery.isError ? getApiErrorMessage(branchesQuery.error, "Could not load locations.") : null;
  const linksError = linksQuery.isError ? getApiErrorMessage(linksQuery.error, "Could not load linked locations.") : null;

  return (
    <ModalBox
      open={open}
      title={`Locations for ${microsite.name}`}
      description="Choose which locations this microsite uses, and what each one can do."
      onClose={onClose}
      size={ModalSize.lg}
      align={ModalAlign.center}
    >
      {!rows && !branchesError && !linksError ? (
        <div className="flex justify-center py-8">
          <Loading label="Loading locations" />
        </div>
      ) : (
        <div className="grid gap-3 text-left">
          {branchesError ? <p className="text-sm text-rose-600">{branchesError}</p> : null}
          {linksError ? <p className="text-sm text-rose-600">{linksError}</p> : null}
          {rows ? <p className="text-xs text-slate-500">Saving replaces the full set of location links for this microsite.</p> : null}
          {rows && rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No locations yet. Add a location first.</p>
          ) : null}
          <ul className="grid gap-2">
            {rows?.map((row) => (
              <li key={row.branchId} className="rounded-xl border border-slate-200 px-3 py-2.5">
                <label className="inline-flex w-fit items-start gap-3">
                  <input
                    type="checkbox"
                    checked={row.included}
                    disabled={saving}
                    onChange={(event) => updateRow(row.branchId, { included: event.target.checked })}
                    className="mt-1 h-4 w-4 accent-teal-700"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">{row.name}</span>
                    <span className="block text-xs text-slate-500">{row.code} · {row.city}</span>
                  </span>
                </label>
                {row.included ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 pl-7">
                    <CapabilityCheck
                      label="Sales"
                      checked={row.supportsSales}
                      disabled={saving}
                      onChange={(checked) => updateRow(row.branchId, { supportsSales: checked })}
                    />
                    <CapabilityCheck
                      label="Service"
                      checked={row.supportsService}
                      disabled={saving}
                      onChange={(checked) => updateRow(row.branchId, { supportsService: checked })}
                    />
                    <CapabilityCheck
                      label="Test drive"
                      checked={row.supportsTestDrive}
                      disabled={saving}
                      onChange={(checked) => updateRow(row.branchId, { supportsTestDrive: checked })}
                    />
                    <Select
                      size="sm"
                      value={row.status}
                      options={linkStatusOptions}
                      disabled={saving}
                      aria-label={`Link status for ${row.name}`}
                      onChange={(value) => updateRow(row.branchId, { status: value === "inactive" ? "inactive" : "active" })}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {rows ? (
            <Button variant={ButtonVariant.primary} width="100%" height={34} disabled={!canSave} onClick={() => void submit()}>
              {saving ? "Saving..." : "Save locations"}
            </Button>
          ) : null}
        </div>
      )}
    </ModalBox>
  );
}
