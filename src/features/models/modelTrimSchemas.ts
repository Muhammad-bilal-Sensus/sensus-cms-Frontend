import { z } from "zod";
import { requiredText } from "@/utils/validators";
import { powertrainTypes, trimStatuses } from "./modelTrimTypes";
import { modelCodeFromName } from "./vehicleModelSchemas";

export function trimCode(versionCode: string, name: string) {
  return [versionCode.trim(), modelCodeFromName(name)].filter(Boolean).join("-").slice(0, 100);
}

export const trimFormSchema = z.object({
  name: requiredText("Enter a trim name.")
    .refine((value) => value.trim().length <= 150, "Use 150 characters or fewer.")
    .refine((value) => modelCodeFromName(value).length > 0, "Enter a name with letters or numbers."),
  powertrain: z.enum(powertrainTypes),
  price: z.string().refine((value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0;
  }, "Enter a price greater than 0."),
  currencyCode: z.string().refine((value) => /^[A-Za-z]{3}$/.test(value.trim()), "Enter a 3-letter currency code."),
  description: z.string(),
  status: z.enum(trimStatuses),
});

export type TrimFormValues = z.infer<typeof trimFormSchema>;

export const emptyTrimForm: TrimFormValues = {
  name: "",
  powertrain: "BEV",
  price: "",
  currencyCode: "KWD",
  description: "",
  status: "draft",
};
