type CapabilityCheckProps = {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
};

export default function CapabilityCheck({ label, checked, disabled, onChange }: CapabilityCheckProps) {
  return (
    <label className="inline-flex w-fit items-center gap-2 text-xs text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-teal-700"
      />
      {label}
    </label>
  );
}
