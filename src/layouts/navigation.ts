import type { IconName } from "./icons";

export type NavItem = {
  label: string;
  to: string;
  icon: IconName;
};

// RFQ Part 2 — Primary navigation (top menu)
export const topNav: NavItem[] = [
  { label: "Models", to: "/models", icon: "car" },
  { label: "Offers", to: "/offers", icon: "tag" },
  { label: "Test Drive", to: "/test-drive", icon: "activity" },
  { label: "Book Service", to: "/book-service", icon: "check" },
  { label: "EV & Technology", to: "/ev-technology", icon: "zap" },
  { label: "Owners", to: "/owners", icon: "user" },
  { label: "News", to: "/news", icon: "news" },
  { label: "About / Contact", to: "/contact", icon: "building" },
];

// CMS areas from the same RFQ: dashboard, CRM leads, locations, media, and content governance
export const sideNav: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: "home" },
  { label: "Leads", to: "/leads", icon: "userPlus" },
  { label: "Locations", to: "/branches", icon: "pin" },
  { label: "Media", to: "/media", icon: "image" },
  { label: "Approvals", to: "/approvals", icon: "check" },
  { label: "Audit Log", to: "/audit", icon: "chart" },
  { label: "Users", to: "/settings/users", icon: "users" },
  { label: "SEO", to: "/settings/seo", icon: "search" },
];

export const allLinks = [...topNav, ...sideNav];
