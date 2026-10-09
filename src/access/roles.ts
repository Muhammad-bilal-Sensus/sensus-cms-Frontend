export enum AppRole {
  SuperAdministrator = "superadmin",
  ContentManager = "content_manager",
  Approver = "approver",
  MarketingSpecialist = "marketing",
  SalesRepresentative = "sales_rep",
  ServiceAdvisor = "service_advisor",
  Guest = "guest",
}

export const ROLE_NAMES: Readonly<Record<AppRole, string>> = {
  [AppRole.SuperAdministrator]: "Super Administrator",
  [AppRole.ContentManager]: "Content Manager",
  [AppRole.Approver]: "Approver",
  [AppRole.MarketingSpecialist]: "Marketing Specialist",
  [AppRole.SalesRepresentative]: "Sales Representative",
  [AppRole.ServiceAdvisor]: "Service Advisor",
  [AppRole.Guest]: "Guest",
};
