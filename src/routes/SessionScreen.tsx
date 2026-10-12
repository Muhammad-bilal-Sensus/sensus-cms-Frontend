import { useEffect } from "react";

export default function SessionScreen() {
  useEffect(() => {
    document.title = "Sensus CMS";
  }, []);

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-hidden bg-black text-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-[58%] rounded-full bg-white/[0.06] blur-3xl"
      />

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 pb-10">
        <div className="text-center">
          <h1 className="font-brand text-[40px] leading-none font-bold tracking-[0.12em] drop-shadow-[0_0_18px_rgba(255,255,255,0.28)]">
            SENSUS
          </h1>
          <p className="font-brand mt-2 text-[22px] leading-none font-medium tracking-[0.42em]">CMS</p>
        </div>

        <div className="mt-12 flex w-full max-w-[220px] flex-col items-center gap-4">
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="session-bar h-full w-1/3 rounded-full bg-white" />
          </div>
          <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">Loading your session</p>
        </div>
      </main>

      <footer className="relative px-4 pb-6 text-center text-[11px] tracking-wide text-white/45">Sensus CMS</footer>
    </div>
  );
}
