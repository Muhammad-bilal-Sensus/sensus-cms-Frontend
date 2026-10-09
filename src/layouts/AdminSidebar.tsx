import { NavLink } from "react-router-dom";
import { usePermission } from "../access/usePermission";
import { Icon } from "@/components/icons/Icon";
import { sideNav } from "./navigation";

type Props = {
  open: boolean;
  onToggle: () => void;
};

export default function AdminSidebar({ open, onToggle }: Props) {
  const { canAny } = usePermission();
  const items = sideNav.filter((item) => canAny(item.permissions ?? []));

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-slate-200/80 bg-[#eef1f4] transition-[width] duration-200 ease-out ${
        open ? "w-64" : "w-[72px]"
      }`}
    >
      <div className={`thin-scroll flex-1 overflow-x-hidden overflow-y-auto py-5 ${open ? "px-3" : "px-2"}`}>
        <p className={`mb-3 px-2 text-[13px] font-medium text-slate-500 ${open ? "" : "sr-only"}`}>
          CMS
        </p>

        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              title={open ? undefined : item.label}
              className={({ isActive }) =>
                `flex h-10 items-center rounded-xl text-[13.5px] transition-colors ${
                  open ? "gap-3 px-3" : "justify-center"
                } ${
                  isActive
                    ? "bg-white font-medium text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-white/80 hover:text-slate-800"
                }`
              }
            >
              <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
              {open && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={`flex items-end gap-3 px-3 pb-4 ${open ? "justify-between" : "justify-center"}`}>
        {open && (
          <p className="pb-1 text-[10px] leading-snug text-slate-400">
            <span className="font-semibold tracking-wide text-slate-500">ALBISHER</span>
            <br />
            CMS
          </p>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          className="flex h-7 w-7 shrink-0 items-center cursor-pointer justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-800"
        >
          <Icon name={open ? "chevronLeft" : "chevronRight"} className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
