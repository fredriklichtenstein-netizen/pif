/**
 * Central category configuration used across post creation,
 * feed filters, and map filters. Keep this list in sync with the
 * translations in src/locales/{en,sv}/categories.json.
 */

// "Blandat" group — always rendered at the top of category selectors.
export const MIXED_CATEGORY_KEYS = ["mixed", "mixed_kids"];

// Remaining categories, sorted alphabetically by Swedish display name.
export const REST_CATEGORY_KEYS = [
  "kids",                  // Barnartiklar
  "kids_clothing",         // Barnkläder
  "books",                 // Böcker
  "bicycle",               // Cykel
  "electronics",           // Elektronik
  "vehicles",              // Fordon
  "hobby",                 // Hobby
  "home_garden",           // Hem & Trädgård
  "pets",                  // Husdjur
  "household",             // Husgeråd
  "health",                // Hälsa
  "art",                   // Konst & hantverk
  "clothing",              // Kläder
  "kitchen",               // Kök
  "toys",                  // Leksaker
  "food",                  // Mat & dryck
  "music",                 // Musik & instrument
  "furniture",             // Möbler
  "samlarobjekt",          // Samlarobjekt
  "skonhet_parfym",        // Skönhet & parfym
  "smycken_accessoarer",   // Smycken & accessoarer
  "games",                 // Spel
  "sports",                // Sport
  "garden",                // Trädgård
  "tools",                 // Verktyg
  "other",                 // Övrigt
];

// Full flat ordered list: Blandat group first, then the rest.
export const CATEGORY_KEYS = [...MIXED_CATEGORY_KEYS, ...REST_CATEGORY_KEYS];

export interface CategoryGroup {
  id: "mixed" | "rest";
  keys: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: "mixed", keys: MIXED_CATEGORY_KEYS },
  { id: "rest", keys: REST_CATEGORY_KEYS },
];

// ---------------- Size & measurements config ----------------

// Categories where size/measurements section should be hidden entirely.
// Mixed buckets and non-physical / size-irrelevant categories.
const HIDE_SIZE_MEASUREMENTS = new Set<string>([
  "mixed",
  "mixed_kids",
  "books",
  "food",
  "music",
  "games",
  "art",
  "electronics",
  "health",
  "pets",
  "household",
  "kitchen",
  "hobby",
  "other",
]);

export function shouldShowSizeMeasurements(category?: string | null): boolean {
  if (!category) return false;
  return !HIDE_SIZE_MEASUREMENTS.has(category);
}

// Detailed measurement fields per category (offer side only).
export const CATEGORY_MEASUREMENT_FIELDS: Record<string, string[]> = {
  clothing: ["Chest", "Length", "Shoulders", "Sleeves", "Collar"],
  kids_clothing: ["Chest", "Length"],
  kids: ["Age", "Height", "Chest", "Length"],
  furniture: ["Width", "Depth", "Height"],
};

// Size preset options per category (used by PostFormSizeSelector).
const ADULT_CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const KIDS_CLOTHING_SIZES = [
  "50", "56", "62", "68", "74", "80", "86", "92", "98", "104",
  "110", "116", "122", "128", "134", "140", "146", "152", "158", "164",
];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

export function getSizeOptionsForCategory(category?: string | null): {
  sizes: string[];
  kind: "adult_clothing" | "kids_clothing" | "shoes" | "none";
} {
  if (!category) return { sizes: [], kind: "none" };
  const c = category.toLowerCase();
  if (c === "kids_clothing") return { sizes: KIDS_CLOTHING_SIZES, kind: "kids_clothing" };
  if (c.includes("clothing")) return { sizes: ADULT_CLOTHING_SIZES, kind: "adult_clothing" };
  if (c.includes("shoes")) return { sizes: SHOE_SIZES, kind: "shoes" };
  return { sizes: [], kind: "none" };
}

export function isMixedCategory(category?: string | null): boolean {
  return !!category && MIXED_CATEGORY_KEYS.includes(category);
}
