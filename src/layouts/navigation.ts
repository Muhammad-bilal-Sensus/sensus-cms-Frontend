import type { IconName } from "./icons";

export type NavItem = {
  label: string;
  to: string;
  icon: IconName;
  permissions?: readonly string[];
};

// RFQ Part 2 — Primary navigation (top menu)
export const topNav: NavItem[] = [
  { label: "Models", to: "/models", icon: "car", permissions: ["models.view"] },
  { label: "Offers", to: "/offers", icon: "tag", permissions: ["offers.view"] },
  { label: "Test Drive", to: "/test-drive", icon: "activity", permissions: ["bookings.view"] },
  { label: "Book Service", to: "/book-service", icon: "check" },
  { label: "EV & Technology", to: "/ev-technology", icon: "zap" },
  { label: "Owners", to: "/owners", icon: "user" },
  { label: "News", to: "/news", icon: "news", permissions: ["articles.create", "articles.publish"] },
  { label: "About / Contact", to: "/contact", icon: "building", permissions: ["pages.create", "pages.publish"] },
];

// CMS areas from the same RFQ: dashboard, CRM leads, locations, media, and content governance
export const sideNav: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: "home" },
  { label: "Leads", to: "/leads", icon: "userPlus", permissions: ["leads.view"] },
  { label: "Locations", to: "/branches", icon: "pin" },
  { label: "Media", to: "/media", icon: "image", permissions: ["media.upload", "media.delete"] },
  { label: "Approvals", to: "/approvals", icon: "check", permissions: ["models.publish", "offers.publish", "pages.publish", "articles.publish"] },
  { label: "Audit Log", to: "/audit", icon: "chart", permissions: ["audit_logs.view"] },
  { label: "Users", to: "/settings/users", icon: "users", permissions: ["users.view"] },
  { label: "Roles", to: "/settings/roles", icon: "clipboard", permissions: ["roles.view"] },
  { label: "SEO", to: "/settings/seo", icon: "search" },
];

export const allLinks = [...topNav, ...sideNav];
