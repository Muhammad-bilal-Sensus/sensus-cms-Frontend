import type { InputHTMLAttributes } from "react";

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  disabled?: boolean;
  name?: string;
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  className?: string;
};

export default function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  disabled = false,
  name,
  autoComplete,
  className = "",
}: InputProps) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      inputMode={inputMode}
      disabled={disabled}
      autoComplete={autoComplete}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`h-10 w-full rounded-full border border-slate-300 bg-white px-4 text-sm font-normal text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}
