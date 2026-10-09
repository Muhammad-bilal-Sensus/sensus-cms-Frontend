import type { Ref, TextareaHTMLAttributes } from "react";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  ref?: Ref<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  name?: string;
  className?: string;
};

export default function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  name,
  className = "",
  ...nativeProps
}: TextareaProps) {
  return (
    <textarea
      {...nativeProps}
      name={name}
      value={value}
      rows={rows}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}
