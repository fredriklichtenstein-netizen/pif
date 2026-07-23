import type { Profile } from "@/types/messaging";

/**
 * Resolve a human-readable display name for a profile.
 * Prefers first_name + last name initial, then first_name, then username,
 * then the localized fallback.
 */
export function resolveDisplayName(
  profile: Pick<Profile, "first_name" | "last_name" | "username"> | null | undefined,
  fallback: string
): string {
  if (!profile) return fallback;
  const first = profile.first_name?.trim();
  const last = profile.last_name?.trim();
  if (first && last) return `${first} ${Array.from(last)[0]}.`;
  if (first) return first;
  if (last) return last;
  const username = profile.username?.trim();
  if (username) return username;
  return fallback;
}

/** Initial letter for an avatar placeholder. */
export function resolveAvatarInitial(
  profile: Pick<Profile, "first_name" | "last_name" | "username"> | null | undefined,
  fallback: string
): string {
  const name = resolveDisplayName(profile, fallback);
  return (Array.from(name)[0] || "").toUpperCase();
}
