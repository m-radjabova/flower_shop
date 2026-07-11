import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const NOINDEX_PREFIXES = ["/admin", "/owner"];
const NOINDEX_EXACT_PATHS = new Set([
  "/cart",
  "/delivery",
  "/favorites",
  "/login",
  "/profile",
  "/register",
  "/shop-application",
]);

function getRobotsContent(pathname: string) {
  if (NOINDEX_EXACT_PATHS.has(pathname)) {
    return "noindex, nofollow";
  }

  if (NOINDEX_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "noindex, nofollow";
  }

  return "index, follow";
}

function SeoRobots() {
  const { pathname } = useLocation();
  const content = getRobotsContent(pathname);

  return (
    <Helmet>
      <meta name="robots" content={content} />
    </Helmet>
  );
}

export default SeoRobots;
