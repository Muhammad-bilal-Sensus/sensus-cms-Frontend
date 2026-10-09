import { describe, expect, it } from "vitest";
import { loginSchema, otpSchema, resetEmailSchema, setPasswordSchema } from "@/features/auth/authSchemas";
import { createUserSchema, editUserSchema, emptyUserForm } from "@/features/users/userSchemas";
import { roleFormSchema } from "@/features/roles/roleSchemas";
import { modelFormSchema, versionFormSchema, trimFormSchema, schemaError } from "@/features/models/modelSchemas";
import { previewModels } from "@/features/models/previewCatalog";
import type { ModelDraft, VersionDraft, TrimDraft } from "@/features/models/modelTypes";
import { MAX_PICTURE_BYTES, profilePictureSchema, profileSchema } from "@/features/profile/profileSchemas";

const validUser = { ...emptyUserForm, firstName: " First ", lastName: " Last ", email: "user@example.test", password: "12345678", confirmPassword: "12345678", roleId: "2" };
const model = previewModels.find((item) => item.versions.length > 0)!;
const version = model.versions[0];
const draft: ModelDraft = { oemId: model.oemId, name: "New model", code: "NEW", slug: "new", bodyType: "suv", status: "draft" };
const versionDraft: VersionDraft = { code: "NEW", name: "New version", modelYear: "2026", status: "draft" };
const trimDraft: TrimDraft = { code: "NEW", name: "New trim", powertrainType: "petrol", price: "0", currencyCode: "SAR", status: "draft" };

describe("Authentication validation contracts", () => {
  it.each(["user@example.test", " user@example.test ", "a+b@example.test"])("accepts existing email format %s without altering input", (email) => {
    expect(loginSchema.parse({ email, password: "x" })).toEqual({ email, password: "x" });
    expect(resetEmailSchema.safeParse({ email }).success).toBe(true);
  });
  it.each(["", " ", "user", "user@example", "a b@example.test"])("rejects invalid email %s", (email) => {
    expect(resetEmailSchema.safeParse({ email }).success).toBe(false);
  });
  it("requires a login password without imposing new password-length rules", () => {
    expect(loginSchema.safeParse({ email: "a@example.test", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@example.test", password: "x" }).success).toBe(true);
  });
  it.each([["123456", true], ["12 456", false], ["12345", false], ["1234567", false], ["", false], ["1 2 3 4 5 6", true]])("validates OTP %s", (otp, valid) => {
    expect(otpSchema.safeParse({ otp }).success).toBe(valid);
  });
  it.each([["", "", false], ["x", "", false], ["x", "y", false], ["x", "x", true]])("preserves reset-password matching rules", (password, password_confirmation, valid) => {
    expect(setPasswordSchema.safeParse({ password, password_confirmation }).success).toBe(valid);
  });
});

describe("User validation contracts", () => {
  it.each([
    ["firstName", " ", "Enter a first name."],
    ["lastName", " ", "Enter a last name."],
    ["email", "bad", "Enter a valid email address."],
    ["password", "", "Enter a password."],
    ["password", "1234567", "Use at least 8 characters."],
    ["confirmPassword", "mismatch", "Passwords do not match."],
    ["roleId", "", "Choose a role."],
  ])("validates create-user %s", (field, value, message) => {
    const result = createUserSchema.safeParse({ ...validUser, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: [field], message })]));
  });
  it("accepts the eight-character boundary and retains untrimmed drafts for the submission mapper", () => {
    expect(createUserSchema.parse(validUser)).toEqual(validUser);
  });
  it.each([["", "", true], ["12345678", "12345678", true], ["1234567", "1234567", false], ["", "12345678", false], ["12345678", "", false]])("keeps edit passwords optional as a pair", (password, confirmPassword, valid) => {
    expect(editUserSchema.safeParse({ ...validUser, password, confirmPassword }).success).toBe(valid);
  });
});

describe("Role validation contracts", () => {
  it.each([["", "Enter a role name."], [" ", "Enter a role name."], ["!!!", "Enter a role name that can be turned into a code."]])("rejects invalid new role names", (name, message) => {
    const result = roleFormSchema().safeParse({ name, description: "", permissionIds: [] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(message);
  });
  it("allows editing a label without regenerating an existing code", () => {
    expect(roleFormSchema("editor").safeParse({ name: "!!!", description: "", permissionIds: [2, 3] }).success).toBe(true);
  });
});

describe("Catalog validation contracts", () => {
  it.each([
    ["oemId", "", "Choose an OEM."],
    ["name", " ", "Enter a model name."],
    ["code", " ", "Enter a model code."],
    ["slug", " ", "Enter a slug."],
    ["code", " " + model.code.toLowerCase() + " ", "This code is already used for this OEM."],
    ["slug", " " + model.slug.toUpperCase() + " ", "This slug is already used for this OEM."],
  ])("validates model %s", (field, value, message) => {
    expect(schemaError(modelFormSchema(previewModels), { ...draft, [field]: value })).toBe(message);
  });
  it("allows unchanged code and slug on the current model", () => {
    expect(schemaError(modelFormSchema(previewModels, model.id), { ...draft, code: model.code, slug: model.slug })).toBeNull();
  });
  it("scopes model uniqueness to the OEM", () => {
    expect(schemaError(modelFormSchema([model]), { ...draft, oemId: "another-oem", code: model.code, slug: model.slug })).toBeNull();
  });
  it.each([["1979", false], ["1980", true], ["2100", true], ["2101", false], ["2026.5", false], ["NaN", false], ["", false]])("validates year %s", (modelYear, valid) => {
    expect(versionFormSchema([]).safeParse({ ...versionDraft, modelYear }).success).toBe(valid);
  });
  it("checks version uniqueness without case or surrounding whitespace", () => {
    expect(schemaError(versionFormSchema(model.versions), { ...versionDraft, code: " " + version.code.toLowerCase() + " " })).toBe("This code is already used on this model.");
  });
  it.each([["-1", false], ["NaN", false], ["Infinity", false], ["0", true], ["123.456", true], ["", true]])("preserves preview price conversion for %s", (price, valid) => {
    expect(trimFormSchema([]).safeParse({ ...trimDraft, price }).success).toBe(valid);
  });
  it("checks trim uniqueness within the selected version", () => {
    const trim = version.trims[0];
    expect(schemaError(trimFormSchema(version.trims), { ...trimDraft, code: " " + trim.code.toLowerCase() + " " })).toBe("This code is already used on this version.");
  });
});

describe("Profile validation contracts", () => {
  it("requires a name and retains optional local-profile values", () => {
    const value = { name: " Profile ", picture: undefined, city: "", timeZone: "", language: "en" };
    expect(profileSchema.parse(value)).toEqual(value);
    expect(profileSchema.safeParse({ ...value, name: " " }).success).toBe(false);
  });
  it.each(["image/jpeg", "image/png", "image/svg+xml"])("allows %s pictures at the size limit", (type) => {
    expect(profilePictureSchema.safeParse({ type, size: MAX_PICTURE_BYTES }).success).toBe(true);
  });
  it("rejects unsupported and oversized pictures with the existing messages", () => {
    const wrongType = profilePictureSchema.safeParse({ type: "image/gif", size: 1 });
    const tooLarge = profilePictureSchema.safeParse({ type: "image/png", size: MAX_PICTURE_BYTES + 1 });
    expect(wrongType.success).toBe(false);
    expect(tooLarge.success).toBe(false);
    if (!wrongType.success) expect(wrongType.error.issues[0].message).toBe("Use a JPG, PNG, or SVG file.");
    if (!tooLarge.success) expect(tooLarge.error.issues[0].message).toBe("Picture must be 10 MB or smaller.");
  });
});
