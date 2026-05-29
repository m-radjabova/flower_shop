import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  HiBars3,
  HiOutlineHeart,
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiXMark,
} from "react-icons/hi2";
import headerLogo from "../../assets/header_logo.png";
import { Skeleton } from "../Skeleton";
import { useFavoritesCount } from "../../hooks/useFavorites";
import { useCartCount } from "../../hooks/useCart";
import useContextPro from "../../hooks/useContextPro";
import { toast } from "react-toastify";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Bouquets", href: "#bouquets" },
  { label: "Categories", href: "#categories" },
  { label: "About Us", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function getUserInitials(fullName?: string) {
  if (!fullName) return "U";

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const location = useLocation();
  const navigate = useNavigate();
  const {
    state: { user, isLoading },
  } = useContextPro();

  const userInitials = getUserInitials(user?.full_name);
  const userFirstName = user?.full_name?.trim().split(/\s+/)[0] ?? "Aurora";
  const favoritesCount = useFavoritesCount();
  const cartCount = useCartCount();

  useEffect(() => {
    if (location.pathname !== "/") {
      const handlePageScroll = () => setScrolled(window.scrollY > 20);
      setActiveSection(location.pathname.startsWith("/bouquets") ? "bouquets" : "home");
      handlePageScroll();
      window.addEventListener("scroll", handlePageScroll, { passive: true });
      return () => window.removeEventListener("scroll", handlePageScroll);
    }

    const handleScroll = () => {
      // Keep header visually merged with the hero until user scrolls deeper.
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 120);

      const sectionIds = ["about", "categories", "bouquets", "contact"];
      const currentSection = sectionIds.reduce((current, sectionId) => {
        const section = document.getElementById(sectionId);

        if (!section) return current;

        const top = section.getBoundingClientRect().top + window.scrollY - 150;
        return scrollPosition >= top ? sectionId : current;
      }, "home");

      const reachedPageEnd =
        window.innerHeight + scrollPosition >= document.documentElement.scrollHeight - 8;

      setActiveSection(reachedPageEnd ? "contact" : currentSection);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleNavClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    const isHomeLink = href === "/";
    const isHashLink = href.startsWith("#");

    if (!isHomeLink && !isHashLink) return;

    event.preventDefault();
    setMenuOpen(false);

    if (location.pathname !== "/" && isHashLink) {
      navigate(`/${href}`);
      return;
    }

    if (isHomeLink) {
      window.history.pushState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveSection("home");
      return;
    }

    const section = document.getElementById(href.slice(1));
    if (!section) return;

    const offset = window.innerWidth >= 1024 ? 112 : 94;
    const top = section.getBoundingClientRect().top + window.scrollY - offset;

    window.history.pushState(null, "", href);
    window.scrollTo({ top, behavior: "smooth" });
    setActiveSection(href.slice(1));
  };

  const handleProtectedRouteClick =
    () =>
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (user) return;
      event.preventDefault();
      setMenuOpen(false);
      toast.info("Avval ro'yxatdan o'ting yoki tizimga kiring");
      navigate("/register");
    };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[rgba(71,7,12,0.88)] shadow-[0_14px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      {/* Top accent line */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffccd1] to-transparent opacity-70 transition-opacity duration-700 ${
          scrolled ? "opacity-40" : "opacity-0"
        }`}
      />

      {/* Glow effect behind header */}
      <div
        className={`absolute -top-32 left-1/2 h-40 w-[600px] -translate-x-1/2 rounded-full bg-[#9f1d2d] blur-[100px] transition-opacity duration-700 ${
          scrolled ? "opacity-[0.08]" : "opacity-0"
        }`}
      />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
        {/* Logo */}
        <Link to="/" className="group flex items-center">
          <div className="relative h-18 w-30 overflow-hidden sm:h-22 sm:w-36">
            <img
              src={headerLogo}
              alt="Muslima Boutique logo"
              className="absolute inset-0 h-full w-full scale-[1.75] object-cover transition duration-500 group-hover:scale-[1.85]"
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const sectionId = item.href === "/" ? "home" : item.href.slice(1);
            const active = activeSection === sectionId;

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={handleNavClick(item.href)}
                aria-current={active ? "page" : undefined}
                className={`group relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  active
                    ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,210,210,0.12)]"
                    : "text-[#f7d6d2] hover:text-white"
                }`}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#ff7e8d] to-[#df5065] transition-all duration-300 ${
                    active ? "w-[64%]" : "w-0 group-hover:w-[70%]"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <Tooltip title="Wishlist" arrow placement="bottom">
            <Link
              to="/favorites"
              onClick={handleProtectedRouteClick()}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#e7c39d] transition-all duration-300 hover:text-[#ffe1ba]"
            >
              <HiOutlineHeart size={24} />
              {favoritesCount ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d64f62] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(212,74,89,0.5)]">
                  {favoritesCount > 99 ? "99+" : favoritesCount}
                </span>
              ) : null}
            </Link>
          </Tooltip>

          <Tooltip title="Cart" arrow placement="bottom">
            <Link
              to="/cart"
              onClick={handleProtectedRouteClick()}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#e7c39d] transition-all duration-300 hover:text-[#ffe1ba]"
            >
              <HiOutlineShoppingBag size={24} />
              {cartCount ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-full bg-[#d64f62] px-1 text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(212,74,89,0.5)]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          </Tooltip>

          <div className="mx-1 h-9 w-px bg-[#5d332f]" />

          {isLoading ? (
            <div className="ml-2 inline-flex items-center gap-3 rounded-full px-2 py-1">
              <Skeleton className="h-[42px] w-[42px] rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-full opacity-80" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <Tooltip title="Open profile" arrow placement="bottom">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-[#f0c89c] transition-all duration-300 hover:bg-[rgba(25,8,10,0.92)]"
                >
                  <Avatar
                    src={user.avatar_url ?? undefined}
                    alt={user.full_name}
                    sx={{
                      width: 42,
                      height: 42,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#fff",
                      background: "linear-gradient(135deg, #b1846a 0%, #6d4032 100%)",
                      border: "1px solid rgba(255, 232, 209, 0.35)",
                    }}
                  >
                    {user.avatar_url ? undefined : userInitials}
                  </Avatar>
                  <span className="font-cormorant text-xl text-[#f0c89c]">Hello, {userFirstName}</span>
                </Link>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 ml-2">
              <Link
                to="/register"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#cf8b84]/30 bg-white/[0.06] px-5 text-sm font-semibold text-[#fff1ef] transition-all duration-300 hover:border-[#efb9b3] hover:bg-white/[0.10] hover:shadow-[0_8px_22px_rgba(255,126,141,0.12)] active:scale-95"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#ff7485] to-[#df5065] px-6 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(212,71,91,0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(212,71,91,0.4)] active:scale-[0.97]"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#87404a] bg-black/15 text-[#ffe8e5] transition-all duration-300 hover:bg-black/25 hover:border-[#a55862] active:scale-90 lg:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <HiXMark size={22} className="animate-[spin_0.3s_ease-in-out]" />
          ) : (
            <HiBars3 size={22} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden border-t border-[#7b1621]/60 transition-all duration-400 ease-in-out lg:hidden ${
          menuOpen
            ? "max-h-[500px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#3a0509]/98 px-4 py-6 backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            {navItems.map((item, index) => {
              const sectionId = item.href === "/" ? "home" : item.href.slice(1);
              const active = activeSection === sectionId;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`group relative rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-white/[0.06] hover:text-white ${
                    active ? "bg-white/[0.08] text-white" : "text-[#f8d8d5]"
                  }`}
                  style={{
                    animation: menuOpen
                      ? `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                      : "none",
                  }}
                  onClick={handleNavClick(item.href)}
                >
                  {item.label}
                  <span
                    className={`absolute right-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#d44a59] transition-opacity duration-300 ${
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                    }`}
                  />
                </a>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 px-4 text-[#f8d8d5]">
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#87404a]/40 bg-white/[0.04] transition-all duration-300 hover:bg-white/[0.10] hover:border-[#a55862]">
              <HiOutlineMagnifyingGlass size={20} />
            </button>
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#87404a]/40 bg-white/[0.04] transition-all duration-300 hover:bg-white/[0.10] hover:border-[#a55862]">
              <HiOutlineHeart size={20} />
            </button>
            <Link
              to="/cart"
              onClick={handleProtectedRouteClick()}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#87404a]/40 bg-white/[0.04] transition-all duration-300 hover:bg-white/[0.10] hover:border-[#a55862]"
            >
              <HiOutlineShoppingBag size={20} />
              {cartCount ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-[#d44a59] to-[#bf2137] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(212,74,89,0.5)]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-4 px-4">
              <div className="inline-flex w-full items-center gap-3 rounded-full border border-[#b96a63]/20 bg-white/[0.04] px-4 py-2.5">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-24 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full opacity-80" />
                </div>
              </div>
            </div>
          ) : user ? (
            <div className="mt-4 flex flex-col gap-3 px-4">
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#b96a63]/30 bg-white/[0.06] px-6 text-sm font-semibold text-[#fff1ef] transition-all duration-300 hover:bg-white/[0.10] hover:border-[#d48982] active:scale-[0.98]"
              >
                Profile
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex gap-3 px-4">
              <Link
                to="/register"
                className="flex-1 inline-flex h-11 items-center justify-center rounded-full border border-[#b96a63]/30 bg-white/[0.06] px-6 text-sm font-semibold text-[#fff1ef] transition-all duration-300 hover:bg-white/[0.10] hover:border-[#d48982] active:scale-[0.98]"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="flex-1 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#ff7485] to-[#df5065] px-6 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(212,71,91,0.25)] transition-all duration-300 hover:shadow-[0_14px_32px_rgba(212,71,91,0.35)] active:scale-[0.98]"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}

export default Header;
