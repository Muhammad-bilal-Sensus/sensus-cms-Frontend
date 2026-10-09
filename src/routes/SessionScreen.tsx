export default function SessionScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white text-slate-600">
      <div className="flex items-center gap-3 text-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
        Loading your session
      </div>
    </div>
  );
}
