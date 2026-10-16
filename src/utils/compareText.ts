export function compareText(left: string, right: string, direction: string) {
  const factor = direction === "desc" ? -1 : 1;
  return left.localeCompare(right) * factor;
}
