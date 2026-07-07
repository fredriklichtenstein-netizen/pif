/**
 * Versioned, migrating storage for the map filter selection.
 *
 * Why versioned?
 * --------------
 * The set of valid categories, conditions, and item types can evolve
 * over time (renames, removals, taxonomy reshuffles). When a user
 * returns after such a change, their previously saved selections may
 * reference values that no longer exist — silently ignoring them is
 * fine, but we want a single, predictable place that handles it.
 *
 * Storage shape (current = v2):
 *   { version: 2, data: { categories: string[], conditions: string[], itemTypes: string[] } }
 *
 * Legacy shape (v1, no `version` field, key `map_filters_v1`):
 *   { categories, conditions, itemTypes }
 *
 * On read we detect the version, run any pending migrations, then
 * sanitise the result against the *current* allowed-values lists
 * supplied by the caller. The cleaned, upgraded payload is written
 * back so the next read is a fast path.
 */

import { safeParseJSON } from "@/utils/safeStorage";


export interface MapFilterData {
  categories: string[];
  conditions: string[];
  itemTypes: string[];
  onlyInterested: boolean;
  hideOwnPosts: boolean;
}

interface VersionedFilterPayload {
  version: number;
  data: MapFilterData;
}

const CURRENT_VERSION = 4;
const STORAGE_KEY = "map_filters";
const LEGACY_KEY_V1 = "map_filters_v1";

const EMPTY: MapFilterData = {
  categories: [],
  conditions: [],
  itemTypes: [],
  onlyInterested: false,
  hideOwnPosts: false,
};

/**
 * Sequential migrations. Each entry takes the data shape produced by
 * the *previous* version and returns the next version's shape. To add
 * a new version, append `{ to: N, run: prev => next }`.
 */
const MIGRATIONS: Array<{ to: number; run: (prev: any) => any }> = [
  { to: 2, run: (prev) => prev },
  { to: 3, run: (prev) => ({ ...prev, onlyInterested: false }) },
  // v3 -> v4: introduce `hideOwnPosts` toggle (default off).
  { to: 4, run: (prev) => ({ ...prev, hideOwnPosts: false }) },
];

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const sanitiseData = (raw: any): MapFilterData => ({
  categories: asStringArray(raw?.categories),
  conditions: asStringArray(raw?.conditions),
  itemTypes: asStringArray(raw?.itemTypes),
  onlyInterested: typeof raw?.onlyInterested === "boolean" ? raw.onlyInterested : false,
  hideOwnPosts: typeof raw?.hideOwnPosts === "boolean" ? raw.hideOwnPosts : false,
});

const readRaw = (): { version: number; data: MapFilterData } | null => {
  const current = safeParseJSON<any>(STORAGE_KEY, null);
  if (current && typeof current === "object" && typeof current.version === "number") {
    return { version: current.version, data: sanitiseData(current.data) };
  }
  const legacy = safeParseJSON<any>(LEGACY_KEY_V1, null);
  if (legacy) {
    return { version: 1, data: sanitiseData(legacy) };
  }
  return null;
};


const runMigrations = (from: number, data: MapFilterData): MapFilterData => {
  let current: any = data;
  for (const m of MIGRATIONS) {
    if (m.to > from) current = m.run(current);
  }
  return sanitiseData(current);
};

interface AllowedValues {
  categories?: readonly string[];
  conditions?: readonly string[];
  itemTypes?: readonly string[];
}

const dropUnknown = (data: MapFilterData, allowed: AllowedValues): MapFilterData => ({
  categories: allowed.categories
    ? data.categories.filter((c) => allowed.categories!.includes(c))
    : data.categories,
  conditions: allowed.conditions
    ? data.conditions.filter((c) => allowed.conditions!.includes(c))
    : data.conditions,
  itemTypes: allowed.itemTypes
    ? data.itemTypes.filter((c) => allowed.itemTypes!.includes(c))
    : data.itemTypes,
  onlyInterested: data.onlyInterested,
  hideOwnPosts: data.hideOwnPosts,
});

/**
 * Load (and lazily migrate) the saved map filters. Pass the current
 * allowed-values lists so any selection that no longer exists is
 * dropped. Migrated payloads are persisted back to storage.
 */
export function loadMapFilters(allowed: AllowedValues = {}): MapFilterData {
  const raw = readRaw();
  if (!raw) return { ...EMPTY };

  const migrated = raw.version < CURRENT_VERSION
    ? runMigrations(raw.version, raw.data)
    : raw.data;

  const cleaned = dropUnknown(migrated, allowed);

  // Upgrade-in-place when the stored version is stale or values were
  // dropped. Also remove the legacy key so it can't shadow future writes.
  const needsWrite =
    raw.version !== CURRENT_VERSION ||
    cleaned.categories.length !== migrated.categories.length ||
    cleaned.conditions.length !== migrated.conditions.length ||
    cleaned.itemTypes.length !== migrated.itemTypes.length;

  if (needsWrite) {
    saveMapFilters(cleaned);
    try { localStorage.removeItem(LEGACY_KEY_V1); } catch { /* ignore */ }
  }

  return cleaned;
}

export function saveMapFilters(data: MapFilterData): void {
  try {
    const payload: VersionedFilterPayload = { version: CURRENT_VERSION, data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* localStorage may be unavailable (private mode, quota); ignore */
  }
}
