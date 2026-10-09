export function permissionCodeSet(permissions: { code: string }[] | null | undefined) {
  return new Set((permissions ?? []).map((permission) => permission.code));
}

export function hasAnyPermission(codes: ReadonlySet<string>, required: readonly string[] | undefined) {
  if (!required || required.length === 0) return true;
  return required.some((code) => codes.has(code));
}
