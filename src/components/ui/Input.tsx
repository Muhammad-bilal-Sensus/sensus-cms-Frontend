import { useState, type InputHTMLAttributes, type Ref } from "react";
import { EyeIcon } from "@/components/icons/FormIcons";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  ref?: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  disabled?: boolean;
  name?: string;
  autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
  revealable?: boolean;
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
  revealable = false,
  className = "",
  ...nativeProps
}: InputProps) {
  const [visible, setVisible] = useState(false);
  const fieldClass = `h-10 w-full rounded-full border border-slate-300 bg-white px-4 text-sm font-normal text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 disabled:cursor-not-allowed disabled:opacity-50 ${revealable ? "!pr-10" : ""} ${className}`;

  const field = (
    <input
      {...nativeProps}
      type={revealable && visible ? "text" : type}
      name={name}
      value={value}
      inputMode={inputMode}
      disabled={disabled}
      autoComplete={autoComplete}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={fieldClass}
    />
  );

  if (!revealable) return field;

  return (
    <div className="relative">
      {field}
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  );
}
