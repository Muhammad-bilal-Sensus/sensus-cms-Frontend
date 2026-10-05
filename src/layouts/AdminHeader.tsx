import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LogoIcon } from "../components/ui/icons";
import { useAuth } from "../hooks/useAuth";
import AllModulesModal from "./AllModulesModal";
import { Icon } from "./icons";
import { topNav } from "./navigation";
import ProfileModal from "./ProfileModal";

function AccountMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const name = user?.name ?? "user";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center"
        aria-haspopup="dialog"
        aria-label="Update profile"
      >
        {user?.picture ? (
          <img src={user.picture} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
            {initial}
          </span>
        )}
        <span className="max-w-24 truncate text-[11px] text-slate-600">{name}</span>
      </button>
      <ProfileModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export default function AdminHeader() {
  const [modulesOpen, setModulesOpen] = useState(false);

  return (
    <header className="z-20 flex h-20 shrink-0 items-center border-b border-slate-200 bg-white pr-4">
      <div className="flex h-full w-[72px] shrink-0 items-center justify-center">
        <LogoIcon />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3 pr-4">
        <nav className="no-scrollbar flex min-w-0 items-center overflow-x-auto gap-2 pl-5">
          {topNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex shrink-0 flex-col items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] leading-none ${isActive ? "font-medium text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`
              }
            >
              <Icon name={item.icon} className="h-6 w-6" />
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setModulesOpen(true)}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] leading-none ${modulesOpen ? "bg-slate-100 font-medium text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
          >
            <Icon name="grid" className="h-6 w-6" />
            <span className="whitespace-nowrap">All Modules</span>
          </button>
        </nav>
      </div>

      <label className="relative hidden shrink-0 md:block">
        <span className="sr-only">Search</span>
        <input
          type="search"
          placeholder="Search"
          className="h-9 w-40 rounded-full border border-slate-200 bg-white pr-9 pl-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 xl:w-52"
        />
        <Icon name="search" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </label>

      <div className="ml-6 flex shrink-0 items-center gap-5 text-slate-400">
        <button type="button" aria-label="Refresh" className="rounded-full p-1 hover:text-slate-700">
          <Icon name="refresh" className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Support" className="rounded-full p-1 hover:text-slate-700">
          <Icon name="headset" className="h-5 w-5" />
        </button>
        <AccountMenu />
      </div>
      <AllModulesModal open={modulesOpen} onClose={() => setModulesOpen(false)} />
    </header>
  );
}
