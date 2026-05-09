import { useEffect, useState } from "react";

/**
 * Stale-while-revalidate cache for avatar IMAGES (not just URLs).
 *
 * Stores small avatars as base64 data URLs in localStorage keyed by their
 * remote URL. On every subsequent render across the app, the avatar paints
 * instantly from the cache without a network request. A background fetch
 * re-validates and updates the cache silently when the bytes change.
 */

const STORAGE_PREFIX = "avatar-img-cache:v1:";
const MAX_BYTES = 512 * 1024; // ~512 KB cap per avatar
const memory = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();

const keyFor = (url: string) => `${STORAGE_PREFIX}${url}`;

const readCache = (url: string): string | null => {
  if (memory.has(url)) return memory.get(url)!;
  try {
    const raw = window.localStorage.getItem(keyFor(url));
    if (!raw) return null;
    memory.set(url, raw);
    return raw;
  } catch {
    return null;
  }
};

const writeCache = (url: string, dataUrl: string) => {
  memory.set(url, dataUrl);
  try {
    window.localStorage.setItem(keyFor(url), dataUrl);
  } catch {
    /* quota — ignore, in-memory cache still helps this session */
  }
};

const fetchAndCache = (url: string): Promise<string | null> => {
  const existing = inFlight.get(url);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) return null;
      const blob = await res.blob();
      if (blob.size > MAX_BYTES) return null; // skip huge images
      const dataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(typeof reader.result === "string" ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (dataUrl) writeCache(url, dataUrl);
      return dataUrl;
    } catch {
      return null;
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, promise);
  return promise;
};

/**
 * Returns the best src to render for an avatar URL.
 * - If the image is already cached, returns the data URL synchronously.
 * - Otherwise returns the original URL and warms the cache in the background.
 */
export const useCachedAvatarSrc = (url: string | null | undefined): string | null => {
  const [src, setSrc] = useState<string | null>(() =>
    url ? readCache(url) ?? url : null,
  );

  useEffect(() => {
    if (!url) {
      setSrc(null);
      return;
    }
    const cached = readCache(url);
    setSrc(cached ?? url);

    // Always revalidate in the background so updated avatars eventually win.
    let cancelled = false;
    fetchAndCache(url).then((dataUrl) => {
      if (!cancelled && dataUrl && dataUrl !== cached) setSrc(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return src;
};

/** Wipe every cached avatar image. Call on sign-out / account switch. */
export const clearAllCachedAvatars = () => {
  memory.clear();
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};
