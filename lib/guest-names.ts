export const MAX_COMPANIONS = 5;

export function normalizeCompanions(value: unknown, legacyCompanion?: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof legacyCompanion === "string" && legacyCompanion.trim()
      ? [legacyCompanion]
      : [];

  return source
    .filter((name): name is string => typeof name === "string")
    .map((name) => name.trim())
    .filter(Boolean);
}

export function formatNames(names: string[]) {
  return new Intl.ListFormat("es", { style: "long", type: "conjunction" }).format(names);
}
