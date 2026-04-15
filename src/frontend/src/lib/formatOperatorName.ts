/**
 * Formats a raw operator string (badge ID or full name) into a friendly
 * display name.
 *
 * Priority:
 * 1. First name (if the string contains letters and at least two parts)
 * 2. First initial + last name (fallback for non-alpha first token)
 * 3. Original value (safe fallback for bare IDs like "970251")
 */
export function formatOperatorName(raw: string | undefined | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    // If the first part contains any letter, use first name only
    if (/[a-zA-Z]/.test(first)) {
      return first;
    }
    // First token is all digits/symbols — use initial + last name
    return `${first.charAt(0).toUpperCase()}. ${last}`;
  }

  // Single token: return as-is (covers bare IDs like "970251")
  return trimmed;
}
