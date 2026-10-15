type SortHeaderProps = {
  label: string;
  field: string;
  sort: string;
  onSort: (sort: string) => void;
};

export default function SortHeader({ label, field, sort, onSort }: SortHeaderProps) {
  const [activeField, activeDirection] = sort.split(":");
  const active = activeField === field;

  return (
    <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
      <span className="uppercase tracking-[0.08em]">{label}</span>
      <span className="inline-flex flex-col gap-px">
        <SortButton label={label} direction="asc" active={active && activeDirection === "asc"} onClick={() => onSort(`${field}:asc`)} />
        <SortButton label={label} direction="desc" active={active && activeDirection === "desc"} onClick={() => onSort(`${field}:desc`)} />
      </span>
    </span>
  );
}

function SortButton({
  label,
  direction,
  active,
  onClick,
}: {
  label: string;
  direction: "asc" | "desc";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Sort ${label} ${direction === "asc" ? "ascending" : "descending"}`}
      onClick={onClick}
      className={`flex h-2 w-2.5 cursor-pointer items-center justify-center ${active ? "text-teal-700" : "text-slate-300 hover:text-slate-500"}`}
    >
      <svg viewBox="0 0 10 6" className="h-1 w-2" fill="currentColor" aria-hidden="true">
        <path d={direction === "asc" ? "M5 0 10 6H0Z" : "M0 0h10L5 6Z"} />
      </svg>
    </button>
  );
}
