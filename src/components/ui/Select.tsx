import type { Ref, SelectHTMLAttributes } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "size"> & {
  ref?: Ref<HTMLSelectElement>;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: "md" | "sm";
  disabled?: boolean;
  name?: string;
};

const sizes = {
  md: { field: "h-10 w-full pl-4 pr-11 text-sm", icon: "right-4" },
  sm: { field: "h-8 w-auto pl-3 pr-8 text-xs", icon: "right-3" },
};

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  size = "md",
  disabled = false,
  name,
  ...nativeProps
}: SelectProps) {
  const style = sizes[size];

  return (
    <div className={`relative ${size === "md" ? "w-full" : "inline-flex"}`}>
      <select
        {...nativeProps}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${style.field} appearance-none rounded-full border border-slate-300 bg-white font-normal text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        className={`pointer-events-none absolute top-1/2 ${style.icon} h-4 w-4 -translate-y-1/2 text-slate-400`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m5 8 5 5 5-5" />
      </svg>
    </div>
  );
}
