/**
 * Resolves a raw operator badge/ID string to "Full Name (Employee ID)" format.
 *
 * This standalone map mirrors the USERS roster from AuthContext without
 * importing from a React context module.
 */
const OPERATOR_NAME_MAP: Record<string, string> = {
  "970251": "Jayson",
  "906779": "Ramon",
  "259254": "Geoffrey",
  "255580": "Ernie",
  "812329": "Joshua",
  "933130": "Wendy",
  "792631": "Valentine",
  "218231": "Connor",
  "222857": "Christopher",
  "264789": "Anthony",
  "583943": "Mike",
  "878288": "Rebecca",
  "215760": "Jeremy",
  "206289": "Archie",
};

/**
 * Returns "Full Name (Employee ID)" if a name is found for the given raw
 * operator string, otherwise returns the raw string as-is.
 *
 * Safe to call with undefined / null — returns "Unknown" in that case.
 */
export function resolveOperatorDisplay(
  operatorRaw: string | undefined | null,
): string {
  if (!operatorRaw) return "Unknown";
  const trimmed = operatorRaw.trim();
  if (!trimmed) return "Unknown";
  const name = OPERATOR_NAME_MAP[trimmed];
  if (name) return `${name} (${trimmed})`;
  return trimmed;
}

/**
 * Returns just the name for a given employee ID, or the raw value as fallback.
 * Useful for acknowledgedBy.name lookups.
 */
export function resolveOperatorName(
  operatorRaw: string | undefined | null,
): string {
  if (!operatorRaw) return "Unknown";
  const trimmed = operatorRaw.trim();
  if (!trimmed) return "Unknown";
  return OPERATOR_NAME_MAP[trimmed] ?? trimmed;
}
