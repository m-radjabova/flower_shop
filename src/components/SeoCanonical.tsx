import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const DEFAULT_SITE_URL = "https://flower-shop-kappa-swart.vercel.app";

function getSiteUrl() {
  return (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

function SeoCanonical() {
  const { pathname } = useLocation();

  useEffect(() => {
    const canonicalPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    const canonicalUrl = `${getSiteUrl()}${canonicalPath}`;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = canonicalUrl;

    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.content = canonicalUrl;
    }
  }, [pathname]);

  return null;
}

export default SeoCanonical;
