import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const DEFAULT_SITE_URL = "https://flower-shop-kappa-swart.vercel.app";

function getSiteUrl() {
  return (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

function SeoCanonical() {
  const { pathname } = useLocation();
  const canonicalPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const canonicalUrl = `${getSiteUrl()}${canonicalPath}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
    </Helmet>
  );
}

export default SeoCanonical;
