import { useEffect } from "react";
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

  useEffect(() => {
    const content = getRobotsContent(pathname);
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');

    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }

    robots.content = content;
  }, [pathname]);

  return null;
}

export default SeoRobots;
