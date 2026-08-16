import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Divider, Menu, MenuItem, Tooltip } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import {
  HiBars3,
  HiOutlineHeart,
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiXMark,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineShieldCheck,
  HiOutlineChartBarSquare,
} from "react-icons/hi2";
import { useTranslation } from "react-i18next";
import headerLogo from "../../assets/header_logo.png";
import { Skeleton } from "../Skeleton";
import { useFavoritesCount } from "../../hooks/useFavorites";
import { useCartCount } from "../../hooks/useCart";
import useContextPro from "../../hooks/useContextPro";
import { toast } from "react-toastify";
import { getPrimaryRole } from "../../utils/roles";

const navItems = [
  { label: "header.home", to: "/" },
  { label: "header.bouquets", to: "/bouquets" },
  { label: "header.shops", to: "/shops" },
  { label: "header.occasions", to: "/occasions" },
  { label: "header.aboutUs", to: "/about-us" },
];

function getUserInitials(fullName?: string) {
  if (!fullName) return "U";
  const parts = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

function getRoleLabel(role: string | undefined, t: (key: string) => string) {
  if (role === "admin") return t("header.administrator");
  if (role === "owner") return t("header.shopOwner");
  return t("header.customer");
}

/** Kichik, minimal "gul" belgisi — header pastidagi lentaning markazida ko'rinadi */
function BloomMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <circle cx="12" cy="7.2" r="2.6" opacity="0.92" />
        <circle cx="17.4" cy="12" r="2.6" opacity="0.78" />
        <circle cx="12" cy="16.8" r="2.6" opacity="0.65" />
        <circle cx="6.6" cy="12" r="2.6" opacity="0.78" />
        <circle cx="12" cy="12" r="1.9" fill="#fff" opacity="0.9" />
      </g>
    </svg>
  );
}

function LanguageSwitcher({ onSelect }: { onSelect?: () => void } = {}) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.split("-")[0];

  const languages = [
    { code: "uz", short: "UZ" },
    { code: "en", short: "EN" },
    { code: "ru", short: "RU" },
  ];

  const handleChangeLang = (lang: string) => {
    void i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
    onSelect?.();
  };

  return (
    <div className="inline-flex items-center rounded-full bg-[rgba(24,6,9,0.72)] p-1 shadow-[inset_0_0_0_1px_rgba(240,197,150,0.14)]">
      {languages.map((lang) => {
        const isActive = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleChangeLang(lang.code)}
            className={`inline-flex h-8 min-w-[2.8rem] items-center justify-center rounded-full px-3 font-cormorant text-base tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#170708] ${
              isActive
                ? "bg-gradient-to-r from-[#ff7d8e] to-[#d84a64] text-white shadow-[0_8px_18px_rgba(216,74,100,0.4)]"
                : "text-[#f0c9a0] hover:bg-white/[0.08] hover:text-white"
            }`}
            aria-label={`Switch language to ${lang.code.toUpperCase()}`}
            aria-pressed={isActive}
          >
            {lang.short}
          </button>
        );
      })}
    </div>
  );
}

const tooltipSlotProps = {
  popper: { sx: { zIndex: 12050 } },
  tooltip: {
    sx: {
      bgcolor: "rgba(18, 4, 7, 0.98)",
      color: "#fff7ef",
      border: "1px solid rgba(240, 197, 150, 0.18)",
      borderRadius: "999px",
      px: 1.4,
      py: 0.7,
      fontSize: "0.78rem",
      fontWeight: 600,
      boxShadow: "0 16px 34px rgba(0,0,0,0.42)",
    },
  },
  arrow: { sx: { color: "rgba(18, 4, 7, 0.98)" } },
} as const;

function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const {
    logout,
    state: { user, isLoading },
  } = useContextPro();

  const userInitials = getUserInitials(user?.full_name);
  const userFirstName = user?.full_name?.trim().split(/\s+/)[0] ?? "Aurora";
  const primaryRole = getPrimaryRole(user);
  const favoritesCount = useFavoritesCount();
  const cartCount = useCartCount();
  const cartActive = location.pathname === "/cart";
  const closeMobileMenu = () => setMenuOpen(false);
  const isNavActive = (to: string) =>
    to === "/"
      ? location.pathname === "/"
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    closeMobileMenu();
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleProtectedRouteClick = () => (event: MouseEvent<HTMLAnchorElement>) => {
    closeMobileMenu();
    if (user) return;
    event.preventDefault();
    toast.info(t("header.loginRequired"));
    navigate("/register");
  };

  const handleSearchClick = () => {
    closeMobileMenu();
    navigate("/bouquets");
  };

  const handleOpenProfileMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };
  const handleCloseProfileMenu = () => setProfileMenuAnchor(null);
  const handleNavigateFromProfileMenu = (to: string) => {
    handleCloseProfileMenu();
    navigate(to);
  };
  const handleLogoutFromProfileMenu = async () => {
    handleCloseProfileMenu();
    await logout();
  };

  const pillTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 34 };

  return (
    <>
      <motion.header
        initial={prefersReducedMotion ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed inset-x-0 top-0 z-[9999] transition-all duration-500 ${
          scrolled
            ? "bg-[rgba(17,4,7,0.78)] shadow-[0_18px_40px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
            : "bg-gradient-to-b from-[rgba(17,4,7,0.42)] to-transparent lg:bg-transparent"
        }`}
      >
        <div className="relative z-20 mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
          {/* Logo */}
          <Link to="/" className="group flex items-center">
            <motion.div
              whileHover={prefersReducedMotion ? undefined : { scale: 1.04, rotate: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="relative h-18 w-30 overflow-hidden sm:h-22 sm:w-36"
            >
              <img
                src={headerLogo}
                alt="Muslima Boutique logo"
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full scale-[1.75] object-cover"
              />
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <nav className="relative hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = isNavActive(item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#170708] ${
                    active ? "text-white" : "text-[#f7d6d2] hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={pillTransition}
                      className="absolute inset-0 rounded-full bg-white/[0.09] shadow-[inset_0_0_0_1px_rgba(255,214,201,0.14)]"
                    />
                  )}
                  <span className="relative z-10">{t(item.label)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />

            <Tooltip title={t("header.wishlist")} arrow placement="bottom" slotProps={tooltipSlotProps}>
              <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }}>
                <Link
                  to="/favorites"
                  onClick={handleProtectedRouteClick()}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#e7c39d] transition-colors duration-300 hover:text-[#ffe1ba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#170708]"
                >
                  <HiOutlineHeart size={24} />
                  {favoritesCount ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d84a64] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(216,74,100,0.5)]">
                      {favoritesCount > 99 ? "99+" : favoritesCount}
                    </span>
                  ) : null}
                </Link>
              </motion.div>
            </Tooltip>

            <Tooltip title={t("header.cart")} arrow placement="bottom" slotProps={tooltipSlotProps}>
              <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }}>
                <Link
                  to="/cart"
                  onClick={handleProtectedRouteClick()}
                  className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#170708] ${
                    cartActive
                      ? "border border-[#ff4d6a]/30 bg-[#ff4d6a]/10 text-[#ff8ca0] shadow-[0_0_20px_rgba(255,106,130,0.25)]"
                      : "text-[#e7c39d] hover:text-[#ffe1ba]"
                  }`}
                >
                  <HiOutlineShoppingBag size={24} />
                  {cartCount ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-full bg-[#d84a64] px-1 text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(216,74,100,0.5)]">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </Link>
              </motion.div>
            </Tooltip>

            <div className="mx-1 h-9 w-px bg-gradient-to-b from-transparent via-[#e9b98a]/35 to-transparent" />

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
                <Tooltip title={t("header.openMenu")} arrow placement="bottom" slotProps={tooltipSlotProps}>
                  <button
                    type="button"
                    onClick={handleOpenProfileMenu}
                    className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-[#f0c9a0] transition-all duration-300 hover:bg-[rgba(25,8,10,0.92)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#170708]"
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
                        border: "1px solid rgba(240, 197, 150, 0.4)",
                      }}
                    >
                      {user.avatar_url ? undefined : userInitials}
                    </Avatar>
                    <span className="font-cormorant text-xl text-[#f0c9a0]">
                      {t("header.hello")}, {userFirstName}
                    </span>
                  </button>
                </Tooltip>
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={Boolean(profileMenuAnchor)}
                  onClose={handleCloseProfileMenu}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1.5,
                        minWidth: 260,
                        borderRadius: "24px",
                        border: "1px solid rgba(216, 116, 116, 0.25)",
                        background:
                          "linear-gradient(160deg, rgba(28, 8, 12, 0.98) 0%, rgba(12, 3, 5, 0.98) 100%)",
                        backdropFilter: "blur(32px)",
                        color: "#fff6f4",
                        boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,200,200,0.04) inset",
                        overflow: "visible",
                        "&::before": {
                          content: '""',
                          display: "block",
                          position: "absolute",
                          top: -6,
                          right: 18,
                          width: 12,
                          height: 12,
                          background: "rgba(28, 8, 12, 0.98)",
                          transform: "rotate(45deg)",
                          borderLeft: "1px solid rgba(216, 116, 116, 0.25)",
                          borderTop: "1px solid rgba(216, 116, 116, 0.25)",
                        },
                      },
                    },
                  }}
                >
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar_url ?? undefined}
                        alt={user.full_name}
                        sx={{
                          width: 44,
                          height: 44,
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#fff",
                          background: "linear-gradient(135deg, #c49a82 0%, #8c5c4a 100%)",
                          border: "2px solid rgba(240, 197, 150, 0.25)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        }}
                      >
                        {user.avatar_url ? undefined : userInitials}
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-cormorant text-lg font-semibold leading-tight text-[#f0d5c5]">
                          {user.full_name || "User"}
                        </span>
                        <span className="text-xs text-[#b0877a] mt-0.5">{getRoleLabel(primaryRole, t)}</span>
                      </div>
                    </div>
                  </div>

                  <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 2 }} />

                  <div className="py-1.5">
                    {primaryRole === "admin" ? (
                      <MenuItem
                        onClick={() => handleNavigateFromProfileMenu("/admin")}
                        sx={{
                          mx: 1, my: 0.3, borderRadius: "14px", py: 1.2, px: 2, gap: 1.5,
                          color: "#f0d5c5", fontSize: 14, fontWeight: 500, transition: "all 0.2s ease",
                          "&:hover": {
                            background: "linear-gradient(135deg, rgba(255,130,150,0.12) 0%, rgba(200,90,100,0.08) 100%)",
                            color: "#ffd4cc",
                          },
                        }}
                      >
                        <HiOutlineShieldCheck size={20} className="text-[#d47a7a]" />
                        {t("header.adminPanel")}
                      </MenuItem>
                    ) : null}
                    {primaryRole === "owner" ? (
                      <MenuItem
                        onClick={() => handleNavigateFromProfileMenu("/owner/dashboard")}
                        sx={{
                          mx: 1, my: 0.3, borderRadius: "14px", py: 1.2, px: 2, gap: 1.5,
                          color: "#f0d5c5", fontSize: 14, fontWeight: 500, transition: "all 0.2s ease",
                          "&:hover": {
                            background: "linear-gradient(135deg, rgba(255,130,150,0.12) 0%, rgba(200,90,100,0.08) 100%)",
                            color: "#ffd4cc",
                          },
                        }}
                      >
                        <HiOutlineChartBarSquare size={20} className="text-[#d47a7a]" />
                        {t("header.ownerDashboard")}
                      </MenuItem>
                    ) : null}
                    <MenuItem
                      onClick={() => handleNavigateFromProfileMenu("/profile")}
                      sx={{
                        mx: 1, my: 0.3, borderRadius: "14px", py: 1.2, px: 2, gap: 1.5,
                        color: "#f0d5c5", fontSize: 14, fontWeight: 500, transition: "all 0.2s ease",
                        "&:hover": {
                          background: "linear-gradient(135deg, rgba(255,130,150,0.12) 0%, rgba(200,90,100,0.08) 100%)",
                          color: "#ffd4cc",
                        },
                      }}
                    >
                      <HiOutlineUser size={20} className="text-[#d47a7a]" />
                      {t("header.myProfile")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => handleNavigateFromProfileMenu("/profile")}
                      sx={{
                        mx: 1, my: 0.3, borderRadius: "14px", py: 1.2, px: 2, gap: 1.5,
                        color: "#f0d5c5", fontSize: 14, fontWeight: 500, transition: "all 0.2s ease",
                        "&:hover": {
                          background: "linear-gradient(135deg, rgba(255,130,150,0.12) 0%, rgba(200,90,100,0.08) 100%)",
                          color: "#ffd4cc",
                        },
                      }}
                    >
                      <HiOutlineCog6Tooth size={20} className="text-[#d47a7a]" />
                      {t("header.settings")}
                    </MenuItem>
                  </div>

                  <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 2 }} />

                  <div className="py-1.5 px-1 pb-2">
                    <MenuItem
                      onClick={handleLogoutFromProfileMenu}
                      sx={{
                        mx: 1, my: 0.3, borderRadius: "14px", py: 1.2, px: 2, gap: 1.5,
                        color: "#e8a098", fontSize: 14, fontWeight: 500, transition: "all 0.2s ease",
                        "&:hover": {
                          background: "linear-gradient(135deg, rgba(255,80,80,0.12) 0%, rgba(180,40,40,0.08) 100%)",
                          color: "#ff6b6b",
                        },
                      }}
                    >
                      <HiOutlineArrowRightOnRectangle size={20} />
                      {t("header.logout")}
                    </MenuItem>
                  </div>
                </Menu>
              </div>
            ) : (
              <div className="ml-2 flex items-center gap-3">
                <Tooltip title={t("header.login")} arrow placement="bottom" slotProps={tooltipSlotProps}>
                  <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/login"
                      aria-label={t("header.login")}
                      className="flex h-[56px] w-[56px] items-center justify-center rounded-full border border-[#e9b98a]/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[#f4cfb9] transition-colors duration-300 hover:bg-white/[0.09] hover:text-[#ffe8d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8fa0]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#170708]"
                    >
                      <HiOutlineArrowRightOnRectangle size={22} />
                    </Link>
                  </motion.div>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/cart"
              onClick={handleProtectedRouteClick()}
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 active:scale-95 ${
                cartActive
                  ? "border-[#ff8fa0]/50 bg-[#ff4d6a]/20 text-white shadow-[0_0_22px_rgba(255,106,130,0.28)]"
                  : "border-[#b66a74]/70 bg-[#170708]/90 text-[#fff4f1] shadow-[0_10px_26px_rgba(0,0,0,0.28)]"
              }`}
              aria-label={t("header.cart")}
            >
              <HiOutlineShoppingBag size={22} />
              {cartCount ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d84a64] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(216,74,100,0.5)]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#b66a74]/70 bg-[#170708]/90 text-[#fff4f1] shadow-[0_10px_26px_rgba(0,0,0,0.28)] transition-all duration-300 active:scale-95"
              aria-label={t("header.toggleMenu")}
            >
              {menuOpen ? <HiXMark size={22} /> : <HiBars3 size={22} />}
            </button>
          </div>
        </div>

        {/* Signature: nozik lenta chizig'i + gullab turuvchi belgi */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 flex justify-center transition-opacity duration-500 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="relative h-px w-full bg-gradient-to-r from-transparent via-[#e9b98a]/45 to-transparent">
            <BloomMark className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-[#e9b98a] drop-shadow-[0_0_6px_rgba(233,185,138,0.55)]" />
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 isolate z-[10000] lg:hidden transition-opacity duration-300 ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          onClick={closeMobileMenu}
          aria-label={t("header.toggleMenu")}
        />

        <motion.aside
          animate={{ x: menuOpen ? 0 : "-100%" }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }}
          className="absolute left-0 top-0 z-10 h-full w-[min(82vw,340px)] overflow-y-auto border-r border-[#7b3038]/70 bg-[linear-gradient(180deg,rgba(48,6,12,0.98),rgba(19,4,6,0.99))] shadow-[20px_0_60px_rgba(0,0,0,0.52)]"
        >
          <div className="flex min-h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
              <Link to="/" onClick={closeMobileMenu} className="flex items-center">
                <div className="relative h-16 w-28 overflow-hidden">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={headerLogo}
                    alt="Muslima Boutique logo"
                    className="absolute inset-0 h-full w-full scale-[1.7] object-cover"
                  />
                </div>
              </Link>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#b66a74]/70 bg-[#190708]/80 text-[#fff4f1] shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition-all duration-300 active:scale-95"
                aria-label={t("header.toggleMenu")}
              >
                <HiXMark size={22} />
              </button>
            </div>

            <div className="flex-1 px-4 py-5">
              <div className="mb-5 rounded-[1.35rem] border border-[#a15b61]/35 bg-white/[0.045] p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e9b98a]">
                  Language
                </p>
                <LanguageSwitcher onSelect={closeMobileMenu} />
              </div>

              <nav className="space-y-2">
                {navItems.map((item, index) => {
                  const active = isNavActive(item.to);
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`group relative flex items-center rounded-[1.15rem] px-4 py-4 text-base font-semibold transition-all duration-300 ${
                        active
                          ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,214,214,0.08)]"
                          : "text-[#f9d8d5] hover:bg-white/[0.05] hover:text-white"
                      }`}
                      style={{
                        animation: menuOpen ? `fadeInUp 0.28s ease-out ${index * 0.045}s both` : "none",
                      }}
                      onClick={closeMobileMenu}
                    >
                      <span>{t(item.label)}</span>
                      <span
                        className={`ml-auto h-2 w-2 rounded-full bg-[#e45768] transition-opacity duration-300 ${
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-5 grid grid-cols-3 gap-3 text-[#fff1ed]">
                <button
                  type="button"
                  onClick={handleSearchClick}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#87404a]/45 bg-white/[0.055] transition-all duration-300 active:scale-95"
                  aria-label="Search"
                >
                  <HiOutlineMagnifyingGlass size={20} />
                </button>
                <Link
                  to="/favorites"
                  onClick={handleProtectedRouteClick()}
                  className="relative inline-flex h-12 items-center justify-center rounded-full border border-[#87404a]/45 bg-white/[0.055] transition-all duration-300 active:scale-95"
                  aria-label={t("header.wishlist")}
                >
                  <HiOutlineHeart size={20} />
                  {favoritesCount ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d84a64] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(216,74,100,0.5)]">
                      {favoritesCount > 99 ? "99+" : favoritesCount}
                    </span>
                  ) : null}
                </Link>
                <Link
                  to="/cart"
                  onClick={handleProtectedRouteClick()}
                  className={`relative inline-flex h-12 items-center justify-center rounded-full border transition-all duration-300 active:scale-95 ${
                    cartActive
                      ? "border-[#ff8094]/45 bg-[#ff4d6a]/15 text-[#ffd4dc]"
                      : "border-[#87404a]/45 bg-white/[0.055]"
                  }`}
                  aria-label={t("header.cart")}
                >
                  <HiOutlineShoppingBag size={20} />
                  {cartCount ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d84a64] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(216,74,100,0.5)]">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </Link>
              </div>

              {isLoading ? (
                <div className="mt-5 rounded-[1.25rem] border border-[#b96a63]/20 bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-24 rounded-full" />
                      <Skeleton className="h-3 w-16 rounded-full opacity-80" />
                    </div>
                  </div>
                </div>
              ) : user ? (
                <div className="mt-5 flex flex-col gap-3">
                  <div className="rounded-[1.25rem] border border-[#b96a63]/20 bg-white/[0.04] p-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar_url ?? undefined}
                        alt={user.full_name}
                        sx={{
                          width: 44,
                          height: 44,
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#fff",
                          background: "linear-gradient(135deg, #c49a82 0%, #8c5c4a 100%)",
                          border: "2px solid rgba(240, 197, 150, 0.2)",
                        }}
                      >
                        {user.avatar_url ? undefined : userInitials}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-cormorant text-lg font-semibold text-[#f4d8d0]">
                          {user.full_name || "User"}
                        </p>
                        <p className="text-xs text-[#b0877a]">{getRoleLabel(primaryRole, t)}</p>
                      </div>
                    </div>
                  </div>

                  {primaryRole === "admin" ? (
                    <Link
                      to="/admin"
                      onClick={closeMobileMenu}
                      className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#b96a63]/30 bg-white/[0.06] px-6 text-sm font-semibold text-[#fff1ef] transition-all duration-300 active:scale-[0.98]"
                    >
                      {t("header.adminPanel")}
                    </Link>
                  ) : null}
                  {primaryRole === "owner" ? (
                    <Link
                      to="/owner/dashboard"
                      onClick={closeMobileMenu}
                      className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#b96a63]/30 bg-white/[0.06] px-6 text-sm font-semibold text-[#fff1ef] transition-all duration-300 active:scale-[0.98]"
                    >
                      {t("header.ownerDashboard")}
                    </Link>
                  ) : null}
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#b96a63]/30 bg-white/[0.06] px-6 text-sm font-semibold text-[#fff1ef] transition-all duration-300 active:scale-[0.98]"
                  >
                    {t("header.profile")}
                  </Link>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    to="/register"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-[#b96a63]/30 bg-white/[0.06] px-4 text-sm font-semibold text-[#fff1ef] transition-all duration-300 active:scale-[0.98]"
                    onClick={closeMobileMenu}
                  >
                    {t("header.signUp")}
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#ff7d8e] to-[#d84a64] px-4 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(216,74,100,0.3)] transition-all duration-300 active:scale-[0.98]"
                    onClick={closeMobileMenu}
                  >
                    {t("header.login")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export default Header;