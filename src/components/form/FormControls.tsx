import type { ComponentProps } from "react";
import { useController, type FieldPathByValue, type FieldValues, type UseFormReturn } from "react-hook-form";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

type BindingProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: FieldPathByValue<T, string>;
  htmlName?: string;
  transform?: (value: string) => string;
  onValueChange?: (value: string) => void;
  clearErrorOnChange?: boolean;
};

function useBinding<T extends FieldValues>({
  form, name, htmlName, transform, onValueChange, clearErrorOnChange = true,
}: BindingProps<T>) {
  const { field, fieldState } = useController({ name, control: form.control });
  return {
    ref: field.ref,
    name: htmlName ?? field.name,
    value: String(field.value ?? ""),
    onBlur: field.onBlur,
    onChange: (value: string) => {
      const next = transform ? transform(value) : value;
      field.onChange(next);
      if (clearErrorOnChange) form.clearErrors(name);
      onValueChange?.(next);
    },
    "aria-invalid": fieldState.invalid || undefined,
  };
}

export function FormInput<T extends FieldValues>(
  { form, name, htmlName, transform, onValueChange, clearErrorOnChange, ...props }:
  BindingProps<T> & Omit<ComponentProps<typeof Input>, "value" | "onChange" | "name" | "ref" | "form">,
) {
  const binding = useBinding({ form, name, htmlName, transform, onValueChange, clearErrorOnChange });
  return <Input {...props} {...binding} />;
}

export function FormSelect<T extends FieldValues>(
  { form, name, htmlName, transform, onValueChange, clearErrorOnChange, ...props }:
  BindingProps<T> & Omit<ComponentProps<typeof Select>, "value" | "onChange" | "name" | "ref" | "form">,
) {
  const binding = useBinding({ form, name, htmlName, transform, onValueChange, clearErrorOnChange });
  return <Select {...props} {...binding} />;
}

export function FormTextarea<T extends FieldValues>(
  { form, name, htmlName, transform, onValueChange, clearErrorOnChange, ...props }:
  BindingProps<T> & Omit<ComponentProps<typeof Textarea>, "value" | "onChange" | "name" | "ref" | "form">,
) {
  const binding = useBinding({ form, name, htmlName, transform, onValueChange, clearErrorOnChange });
  return <Textarea {...props} {...binding} />;
}
