import type { ReactNode } from "react";

export type IconName =
  | "bell"
  | "home"
  | "flame"
  | "chart"
  | "star"
  | "userPlus"
  | "activity"
  | "board"
  | "grid"
  | "moon"
  | "headset"
  | "refresh"
  | "search"
  | "user"
  | "building"
  | "users"
  | "card"
  | "pin"
  | "target"
  | "settings"
  | "chevronLeft"
  | "chevronRight"
  | "news"
  | "car"
  | "tag"
  | "zap"
  | "image"
  | "check"
  | "calendar"
  | "clock"
  | "megaphone"
  | "clipboard";

const icons: Record<IconName, ReactNode> = {
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 10v10h11V10" />
    </>
  ),
  flame: <path d="M12 3s6 4.5 6 9a6 6 0 0 1-12 0c0-2 1.5-3.5 1.5-3.5S8.5 11 10.5 11C10.5 8 12 3 12 3Z" />,
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-4" />
      <path d="M12 16V8" />
      <path d="M16 16v-6" />
    </>
  ),
  star: <path d="m12 3 2.4 5 5.6.8-4 3.9.9 5.8L12 16.8 7.1 18.5l1-5.8-4-3.9 5.5-.8L12 3Z" />,
  userPlus: (
    <>
      <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="3" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </>
  ),
  activity: <path d="M3 12h4l2.2-6 4.3 12 2.2-6H21" />,
  board: (
    <>
      <path d="M4 5h16v10H4z" />
      <path d="M8 19h8" />
      <path d="M12 15v4" />
      <path d="m8 12 2.2-2.2L13 12l3-3" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.2 8.2 0 1 1 9.5 3.4 6.6 6.6 0 0 0 20.5 14.5Z" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" />
      <path d="M4 20v-4h4" />
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" />
      <path d="M16 4h4v4" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M4 13v4a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 1Z" />
      <path d="M20 13v4a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 1Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c1.1-3 3.2-4.5 6.5-4.5s5.4 1.5 6.5 4.5" />
    </>
  ),
  building: (
    <>
      <path d="M4 20V7l8-3 8 3v13" />
      <path d="M9 20v-4h6v4" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.8-2.6 2.7-4 5.5-4s4.7 1.4 5.5 4" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M16.2 14.2c1.8.3 3.2 1.4 3.8 3.3" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.8 7-11a7 7 0 1 0-14 0c0 5.2 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" />
    </>
  ),
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  news: (
    <>
      <path d="M5 5h11a2 2 0 0 1 2 2v12H7a2 2 0 0 0-2 2V5Z" />
      <path d="M5 19a2 2 0 0 0 2 2h11" />
      <path d="M8 9h7M8 13h7" />
    </>
  ),
  car: (
    <>
      <path d="M4 15h16l-1.4-4.2A2 2 0 0 0 16.7 9H7.3a2 2 0 0 0-1.9 1.8L4 15Z" />
      <path d="M5 15v2.5M19 15v2.5" />
      <circle cx="7.5" cy="16.5" r="1.2" />
      <circle cx="16.5" cy="16.5" r="1.2" />
    </>
  ),
  tag: (
    <>
      <path d="M12 4h6v6l-8.2 8.2a2 2 0 0 1-2.8 0L4.8 16a2 2 0 0 1 0-2.8L12 4Z" />
      <circle cx="15.5" cy="8.5" r="1" />
    </>
  ),
  zap: <path d="M13 3 5 13h7l-1 8 8-10h-7l1-8Z" />,
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.4" />
      <path d="m7 16 3.2-3.2L16 18" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.2 2.3 2.3 4.7-5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M7.5 3v4M16.5 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  megaphone: (
    <>
      <path d="m4 11 15-6v14L4 13v-2Z" />
      <path d="m7 14 2 6h4l-2-5M19 10h2M19 14h2" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <path d="M9 5V3h6v2M8.5 10h7M8.5 14h7M8.5 18h4" />
    </>
  ),
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 48 56" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#d32f2f"
        fillRule="evenodd"
        d="M4 17.5h40a2.5 2.5 0 0 0 2.5-2.5v-4A2.5 2.5 0 0 0 44 8.5H31V6.2A3.2 3.2 0 0 0 27.8 3h-7.6A3.2 3.2 0 0 0 17 6.2V8.5H4A2.5 2.5 0 0 0 1.5 11v4A2.5 2.5 0 0 0 4 17.5Zm14.2-11.3h11.6a1 1 0 0 1 1 1V9H17.2V7.2a1 1 0 0 1 1-1ZM6 20h36v28.5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V20Zm7.2 6h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6h-3.2a1.6 1.6 0 0 1-1.6-1.6V27.6A1.6 1.6 0 0 1 13.2 26Zm9.2 0h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6h-3.2a1.6 1.6 0 0 1-1.6-1.6V27.6a1.6 1.6 0 0 1 1.6-1.6Zm9.2 0h3.2a1.6 1.6 0 0 1 1.6 1.6v16.8a1.6 1.6 0 0 1-1.6 1.6H31.6a1.6 1.6 0 0 1-1.6-1.6V27.6a1.6 1.6 0 0 1 1.6-1.6Z"
      />
    </svg>
  );
}
