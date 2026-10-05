import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.title = "Albisher CMS";
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f6f8] text-slate-800">
      <AdminHeader />
      <div className="flex min-h-0 flex-1">
        <AdminSidebar open={open} onToggle={() => setOpen((value) => !value)} />
        <main className="min-w-0 flex-1 overflow-auto px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
