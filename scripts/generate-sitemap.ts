// Generates public/sitemap.xml before `vite dev` and `vite build`.
// Lists static public routes plus one entry per active item.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://app.pif.community";

const SUPABASE_URL = "https://heurpehcwbhohwklqnir.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhldXJwZWhjd2Job2h3a2xxbmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Mjg1OTAsImV4cCI6MjA4OTEwNDU5MH0.53GF3SNG4gmwUGKNdaZx5i8PVy4f73FN7x53jna_l9w";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/feed", changefreq: "hourly", priority: "0.9" },
  { path: "/map", changefreq: "hourly", priority: "0.8" },
  { path: "/auth", changefreq: "monthly", priority: "0.3" },
];

async function fetchActiveItems(): Promise<SitemapEntry[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/items?select=id,created_at&archived_at=is.null&or=(pif_status.is.null,pif_status.neq.archived)&limit=10000`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] items fetch failed: ${res.status} ${await res.text()}`);
      return [];
    }
    const rows = (await res.json()) as Array<{ id: number | string; created_at?: string }>;
    return rows.map((r) => ({
      path: `/item/${r.id}`,
      lastmod: (r.created_at || "").slice(0, 10) || undefined,
      changefreq: "daily",
      priority: "0.7",
    }));
  } catch (err) {
    console.warn("[sitemap] items fetch error:", err);
    return [];
  }
}

function render(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

const itemEntries = await fetchActiveItems();
const entries = [...staticEntries, ...itemEntries];
writeFileSync(resolve("public/sitemap.xml"), render(entries));
console.log(`sitemap.xml written (${entries.length} entries, ${itemEntries.length} items)`);
