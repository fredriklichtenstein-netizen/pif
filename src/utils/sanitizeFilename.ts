/**
 * Sanitize a filename for use as a Supabase Storage object key.
 *
 * Storage rejects keys with spaces, non-ASCII characters, and certain
 * punctuation. This helper:
 *  - transliterates common non-ASCII letters (å→a, ä→a, ö→o, …) via NFKD
 *    decomposition + diacritic stripping
 *  - preserves only the final file extension
 *  - replaces any remaining non-[a-zA-Z0-9._-] character with "-"
 *  - collapses repeat separators and trims to a reasonable length
 */
export function sanitizeFilename(name: string, maxBaseLength = 60): string {
  if (!name) return "file";

  // Split off the final extension.
  const lastDot = name.lastIndexOf(".");
  let base = lastDot > 0 ? name.slice(0, lastDot) : name;
  let ext = lastDot > 0 ? name.slice(lastDot + 1) : "";

  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .replace(/ø/gi, "o")
      .replace(/æ/gi, "ae")
      .replace(/ß/gi, "ss")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "");

  base = clean(base).slice(0, maxBaseLength) || "file";
  ext = clean(ext).toLowerCase().slice(0, 10);

  return ext ? `${base}.${ext}` : base;
}
