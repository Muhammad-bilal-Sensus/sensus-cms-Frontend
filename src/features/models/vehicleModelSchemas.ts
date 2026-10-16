import { z } from "zod";
import { requiredText } from "@/utils/validators";
import { modelStatuses } from "./vehicleModelTypes";

function modelKey(name: string) {
  return name
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function modelCodeFromName(name: string) {
  return modelKey(name).toUpperCase();
}

export function modelSlugFromName(name: string) {
  return modelKey(name).toLowerCase();
}

export const vehicleModelFormSchema = z.object({
  oemId: z.string().min(1, "Choose an OEM."),
  name: requiredText("Enter a model name.").refine(
    (value) => modelCodeFromName(value).length > 0,
    "Enter a name with letters or numbers.",
  ),
  bodyType: requiredText("Enter a body type.").refine((value) => value.trim().length <= 100, "Use 100 characters or fewer."),
  shortDescription: z.string(),
  description: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  keywords: z.string(),
  isFeatured: z.boolean(),
  status: z.enum(modelStatuses),
});

export type VehicleModelFormValues = z.infer<typeof vehicleModelFormSchema>;

export const emptyVehicleModelForm: VehicleModelFormValues = {
  oemId: "",
  name: "",
  bodyType: "",
  shortDescription: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  isFeatured: false,
  status: "draft",
};
