import { useEffect, useState, type FormEvent } from "react";
import {
  currencyOptions,
  powertrainOptions,
  statusOptions,
  type PowertrainType,
  type PublishStatus,
  type TrimDraft,
} from "../../modules/models/types";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import Select from "./Select";
import { Field } from "./modelControls";

const emptyTrim: TrimDraft = {
  code: "",
  name: "",
  powertrainType: "petrol",
  price: "",
  currencyCode: "SAR",
  status: "draft",
};

type TrimModalProps = {
  open: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (draft: TrimDraft) => void;
};

export default function TrimModal({ open, error, onClose, onSubmit }: TrimModalProps) {
  const [draft, setDraft] = useState<TrimDraft>(emptyTrim);

  useEffect(() => {
    if (open) setDraft(emptyTrim);
  }, [open]);

  function save(event: FormEvent) {
    event.preventDefault();
    onSubmit(draft);
  }

  return (
    <Modal
      open={open}
      title="Add trim"
      description="One current retail price and currency for this version."
      onClose={onClose}
    >
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" hint="Unique on this version.">
          <Input
            value={draft.code}
            onChange={(value) => setDraft((current) => ({ ...current, code: value.toUpperCase() }))}
          />
        </Field>
        <Field label="Name">
          <Input
            value={draft.name}
            onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
          />
        </Field>
        <Field label="Powertrain">
          <Select
            value={draft.powertrainType}
            onChange={(value) => setDraft((current) => ({ ...current, powertrainType: value as PowertrainType }))}
            options={powertrainOptions}
          />
        </Field>
        <Field label="Price">
          <Input
            inputMode="decimal"
            value={draft.price}
            onChange={(value) => setDraft((current) => ({ ...current, price: value }))}
          />
        </Field>
        <Field label="Currency">
          <Select
            value={draft.currencyCode}
            onChange={(value) => setDraft((current) => ({ ...current, currencyCode: value }))}
            options={currencyOptions.map((currency) => ({ value: currency, label: currency }))}
          />
        </Field>
        <Field label="Status">
          <Select
            value={draft.status}
            onChange={(value) => setDraft((current) => ({ ...current, status: value as PublishStatus }))}
            options={statusOptions}
          />
        </Field>
        {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Add trim
          </Button>
        </div>
      </form>
    </Modal>
  );
}
