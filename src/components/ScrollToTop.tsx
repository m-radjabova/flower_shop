import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      window.setTimeout(() => {
        const section = document.getElementById(hash.slice(1));
        const offset = window.innerWidth >= 1024 ? 112 : 94;

        if (section) {
          const top = section.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, left: 0, behavior: "smooth" });
        }
      }, 0);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [hash, pathname]);

  return null;
}

export default ScrollToTop;
