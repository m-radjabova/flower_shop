import { mkdir, writeFile } from "node:fs/promises";

const SITE_URL = (process.env.VITE_SITE_URL || "https://flower-shop-kappa-swart.vercel.app").replace(/\/+$/, "");
const API_URL = (process.env.VITE_API_URL || process.env.VITE_API_ORIGIN || "http://127.0.0.1:8000").replace(/\/+$/, "");
const OUTPUT_PATH = new URL("../public/sitemap.xml", import.meta.url);
const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/bouquets", changefreq: "daily", priority: "0.9" },
  { path: "/shops", changefreq: "daily", priority: "0.9" },
  { path: "/occasions", changefreq: "weekly", priority: "0.8" },
  { path: "/about-us", changefreq: "monthly", priority: "0.6" },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function toUrlEntry({ path, changefreq, priority, lastmod }) {
  const lines = [
    "  <url>",
    `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
  ];

  if (lastmod) {
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
  }

  lines.push(`    <changefreq>${changefreq}</changefreq>`);
  lines.push(`    <priority>${priority}</priority>`);
  lines.push("  </url>");

  return lines.join("\n");
}

async function fetchJson(path) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return response.json();
}

async function getShopEntries() {
  const shops = await fetchJson("/shops");

  if (!Array.isArray(shops)) {
    return [];
  }

  return shops
    .filter((shop) => shop?.slug && shop?.status === "active")
    .map((shop) => ({
      path: `/shops/${shop.slug}`,
      changefreq: "daily",
      priority: "0.8",
      lastmod: normalizeDate(shop.updated_at),
    }));
}

async function getBouquetEntries() {
  const entries = [];
  const limit = 200;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await fetchJson(`/bouquets/page?limit=${limit}&offset=${offset}`).catch(async (error) => {
      if (offset > 0) {
        throw error;
      }

      const bouquets = await fetchJson("/bouquets");
      return {
        items: Array.isArray(bouquets) ? bouquets : [],
        has_more: false,
      };
    });
    const items = Array.isArray(page?.items) ? page.items : [];

    entries.push(
      ...items
        .filter((bouquet) => (bouquet?.slug || bouquet?.id) && bouquet?.status === "active")
        .map((bouquet) => ({
          path: `/bouquets/${encodeURIComponent(bouquet.slug || bouquet.id)}`,
          changefreq: "daily",
          priority: "0.7",
          lastmod: normalizeDate(bouquet.updated_at),
        })),
    );

    hasMore = Boolean(page?.has_more);
    offset += items.length;

    if (!items.length) {
      break;
    }
  }

  return entries;
}

async function generateSitemap() {
  const dynamicGroups = await Promise.allSettled([getShopEntries(), getBouquetEntries()]);
  const dynamicEntries = dynamicGroups.flatMap((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    console.warn(`[sitemap] ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    return [];
  });

  const uniqueEntries = new Map();

  [...STATIC_ROUTES, ...dynamicEntries].forEach((entry) => {
    uniqueEntries.set(entry.path, entry);
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from(uniqueEntries.values()).map(toUrlEntry),
    "</urlset>",
    "",
  ].join("\n");

  await mkdir(new URL("../public", import.meta.url), { recursive: true });
  await writeFile(OUTPUT_PATH, xml, "utf8");
  console.log(`[sitemap] Generated ${uniqueEntries.size} URLs into public/sitemap.xml`);
}

generateSitemap().catch((error) => {
  console.error("[sitemap] Generation failed", error);
  process.exitCode = 1;
});
