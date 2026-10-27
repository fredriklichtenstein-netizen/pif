// Origin of shareable item links (<SHARE_ORIGIN>/item/<id>). It is served by
// the share-link Worker (workers/share), which gives link-preview crawlers
// item-specific OG tags and redirects browsers to the app. Staging builds set
// VITE_SHARE_ORIGIN to the staging Worker's hostname.
export const SHARE_ORIGIN = import.meta.env.VITE_SHARE_ORIGIN || "https://app.pif.community";
