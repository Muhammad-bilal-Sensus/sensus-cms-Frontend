import { useEffect } from "react";
import {
  currencyOptions,
  powertrainOptions,
  statusOptions,
  type TrimDraft,
  type ModelTrim,
} from "../modelTypes";
import Button from "@/components/ui/Button";
import { FormInput, FormSelect } from "@/components/form/FormControls";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { getFormError } from "@/utils/forms";
import { trimFormSchema } from "../modelSchemas";
import Modal from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";

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
  trims: ModelTrim[];
  onClose: () => void;
  onSubmit: (draft: TrimDraft) => void;
};

export default function TrimModal({ open, error, trims, onClose, onSubmit }: TrimModalProps) {
  const form = useSchemaForm(trimFormSchema(trims), emptyTrim);
  const { reset } = form;
  const formError = getFormError(form.formState.errors) ?? error;

  useEffect(() => {
    if (open) reset(emptyTrim);
  }, [open, reset]);

  return (
    <Modal
      open={open}
      title="Add trim"
      description="One current retail price and currency for this version."
      onClose={onClose}
    >
      <form onSubmit={form.submitForm(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" hint="Unique on this version.">
          <FormInput
            form={form}
            name="code"
            clearErrorOnChange={false}
            transform={(value) => value.toUpperCase()}
          />
        </Field>
        <Field label="Name">
          <FormInput
            form={form}
            name="name"
            clearErrorOnChange={false}
          />
        </Field>
        <Field label="Powertrain">
          <FormSelect
            form={form}
            name="powertrainType"
            clearErrorOnChange={false}
            options={powertrainOptions}
          />
        </Field>
        <Field label="Price">
          <FormInput
            inputMode="decimal"
            form={form}
            name="price"
            clearErrorOnChange={false}
          />
        </Field>
        <Field label="Currency">
          <FormSelect
            form={form}
            name="currencyCode"
            clearErrorOnChange={false}
            options={currencyOptions.map((currency) => ({ value: currency, label: currency }))}
          />
        </Field>
        <Field label="Status">
          <FormSelect
            form={form}
            name="status"
            clearErrorOnChange={false}
            options={statusOptions}
          />
        </Field>
        {formError ? <p className="text-sm text-rose-600 sm:col-span-2">{formError}</p> : null}
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
