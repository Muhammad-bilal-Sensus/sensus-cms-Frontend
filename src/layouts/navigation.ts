import { ROUTES } from "@/constants/routes";
import type { IconName } from "@/components/icons/Icon";

export type NavItem = {
  label: string;
  to: string;
  icon: IconName;
  permissions?: readonly string[];
};

// RFQ Part 2 — Primary navigation (top menu)
export const topNav: NavItem[] = [
  { label: "Models", to: ROUTES.models, icon: "car", permissions: ["models.view"] },
  { label: "Offers", to: ROUTES.offers, icon: "tag", permissions: ["offers.view"] },
  { label: "Test Drive", to: ROUTES.testDrive, icon: "activity", permissions: ["bookings.view"] },
  { label: "Book Service", to: ROUTES.bookService, icon: "check" },
  { label: "EV & Technology", to: ROUTES.evTechnology, icon: "zap" },
  { label: "Owners", to: ROUTES.owners, icon: "user" },
  { label: "News", to: ROUTES.news, icon: "news", permissions: ["articles.create", "articles.publish"] },
  { label: "About / Contact", to: ROUTES.contact, icon: "building", permissions: ["pages.create", "pages.publish"] },
];

// CMS areas from the same RFQ: dashboard, CRM leads, locations, media, and content governance
export const sideNav: NavItem[] = [
  { label: "Dashboard", to: ROUTES.home, icon: "home" },
  { label: "Leads", to: ROUTES.leads, icon: "userPlus", permissions: ["leads.view"] },
  { label: "Locations", to: ROUTES.branches, icon: "pin" },
  { label: "Media", to: ROUTES.media, icon: "image", permissions: ["media.upload", "media.delete"] },
  { label: "Approvals", to: ROUTES.approvals, icon: "check", permissions: ["models.publish", "offers.publish", "pages.publish", "articles.publish"] },
  { label: "Audit Log", to: ROUTES.audit, icon: "chart", permissions: ["audit_logs.view"] },
  { label: "Users", to: ROUTES.users, icon: "users", permissions: ["users.view"] },
  { label: "Roles", to: ROUTES.roles, icon: "clipboard", permissions: ["roles.view"] },
  { label: "SEO", to: ROUTES.seo, icon: "search" },
];

export const allLinks = [...topNav, ...sideNav];
