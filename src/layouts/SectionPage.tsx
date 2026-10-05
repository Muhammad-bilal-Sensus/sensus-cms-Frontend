import { useLocation } from "react-router-dom";
import { allLinks } from "./navigation";

export default function SectionPage() {
  const { pathname } = useLocation();
  const current = allLinks.find((item) => item.to === pathname);
  const label = current?.label ?? "Page";

  return (
    <div>
      <p className="text-[13px] text-slate-400">Albisher CMS / {label}</p>
      <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">{label}</h1>
    </div>
  );
}
