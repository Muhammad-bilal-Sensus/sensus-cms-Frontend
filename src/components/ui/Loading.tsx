type LoadingProps = {
  label?: string;
  overlay?: boolean;
};

export default function Loading({ label = "Loading", overlay = false }: LoadingProps) {
  const content = (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" aria-hidden="true" />
      {label}
    </div>
  );

  if (!overlay) return content;

  return <div className="absolute inset-0 flex items-center justify-center bg-white/70">{content}</div>;
}
