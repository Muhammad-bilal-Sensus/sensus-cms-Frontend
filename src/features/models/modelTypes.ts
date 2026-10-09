export type PublishStatus = "draft" | "published" | "inactive";

export type BodyType = "suv" | "sedan" | "pickup" | "hatchback" | "mpv" | "coupe";

export type PowertrainType = "petrol" | "diesel" | "hybrid" | "plug_in_hybrid" | "electric";

export type ContentSectionKey =
  | "overview"
  | "exterior"
  | "interior"
  | "performance"
  | "technology"
  | "safety"
  | "charging"
  | "highlights";

export type Oem = {
  id: string;
  name: string;
  code: string;
};

export type SpecificationDefinition = {
  id: string;
  category: string;
  name: string;
  unit: string;
  isFilterable: boolean;
  status: PublishStatus;
};

export type TrimSpecificationValue = {
  specificationDefinitionId: string;
  displayValue: string;
  numericValue: number | null;
};

export type ModelTrim = {
  id: string;
  code: string;
  name: string;
  powertrainType: PowertrainType;
  price: number;
  currencyCode: string;
  status: PublishStatus;
  specifications: TrimSpecificationValue[];
};

export type ModelMedia = {
  id: string;
  name: string;
};

export type ContentSection = {
  key: ContentSectionKey;
  body: string;
};

export type ModelVersion = {
  id: string;
  code: string;
  name: string;
  modelYear: number;
  status: PublishStatus;
  contentSections: ContentSection[];
  media: ModelMedia[];
  trims: ModelTrim[];
};

export type CatalogModel = {
  id: string;
  oemId: string;
  code: string;
  name: string;
  slug: string;
  bodyType: BodyType;
  status: PublishStatus;
  versions: ModelVersion[];
};

export type ModelDraft = {
  oemId: string;
  code: string;
  name: string;
  slug: string;
  bodyType: BodyType;
  status: PublishStatus;
};

export type VersionDraft = {
  code: string;
  name: string;
  modelYear: string;
  status: PublishStatus;
};

export type TrimDraft = {
  code: string;
  name: string;
  powertrainType: PowertrainType;
  price: string;
  currencyCode: string;
  status: PublishStatus;
};

export const contentSectionOrder: { key: ContentSectionKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "exterior", label: "Exterior" },
  { key: "interior", label: "Interior" },
  { key: "performance", label: "Performance" },
  { key: "technology", label: "Technology" },
  { key: "safety", label: "Safety" },
  { key: "charging", label: "Charging" },
  { key: "highlights", label: "Highlights / CTA" },
];

export const bodyTypeOptions: { value: BodyType; label: string }[] = [
  { value: "suv", label: "SUV" },
  { value: "sedan", label: "Sedan" },
  { value: "pickup", label: "Pickup" },
  { value: "hatchback", label: "Hatchback" },
  { value: "mpv", label: "MPV" },
  { value: "coupe", label: "Coupe" },
];

export const powertrainOptions: { value: PowertrainType; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "plug_in_hybrid", label: "Plug-in hybrid" },
  { value: "electric", label: "Electric" },
];

export const statusOptions: { value: PublishStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "inactive", label: "Inactive" },
];

export const currencyOptions = ["SAR", "AED", "USD"];

export function labelFor<T extends string>(options: { value: T; label: string }[], value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function formatMoney(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString("en-SA")}`;
  }
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sameKey(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
