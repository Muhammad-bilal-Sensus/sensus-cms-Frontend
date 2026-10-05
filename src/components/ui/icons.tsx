export function LogoIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-14 w-14 shrink-0" aria-label="Albisher">
      <circle cx="20" cy="20" r="20" fill="#111111" />
      <text
        x="20"
        y="22.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="6.4"
        fontWeight="700"
        fontFamily="Segoe UI, sans-serif"
        letterSpacing="0.4"
      >
        ALBISHER
      </text>
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" strokeLinecap="round" />
    </svg>
  );
}

export function EyeIcon({ off }: { off: boolean }) {
  if (off) {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4 4l16 16" strokeLinecap="round" />
        <path d="M9.9 9.9A3.2 3.2 0 0 0 12 15.2 3.2 3.2 0 0 0 14.2 12" strokeLinecap="round" />
        <path d="M6.2 6.7C4.3 8 2.8 10 2 12c1.6 4 5.4 7 10 7 1.7 0 3.3-.4 4.7-1.1M10.6 5.1A10 10 0 0 1 12 5c4.6 0 8.4 3 10 7-.4 1.1-1.1 2.2-1.9 3.1" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
