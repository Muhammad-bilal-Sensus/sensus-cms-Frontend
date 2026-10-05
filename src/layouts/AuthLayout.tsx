import { useEffect, type ReactNode } from "react";
import { Outlet } from "react-router-dom";

function BrandMark() {
  return (
    <div className="text-center text-white">
      <h1 className="font-brand text-[40px] leading-none font-bold tracking-[0.12em] text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.28)]">
        SENSUS
      </h1>
      <p className="font-brand mt-2 text-[22px] leading-none font-medium tracking-[0.42em] text-white">CMS</p>
    </div>
  );
}

export default function AuthLayout({ children }: { children?: ReactNode }) {
  useEffect(() => {
    document.title = "Sensus CMS";
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white">
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
        <BrandMark />
        <div className="mt-12 w-full max-w-[400px]">{children ?? <Outlet />}</div>
      </main>
      <footer className="px-4 pb-6 text-center text-[11px] tracking-wide text-white/45">
        Sensus CMS
      </footer>
    </div>
  );
}
