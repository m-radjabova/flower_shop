import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Divider, Menu, MenuItem, Tooltip } from "@mui/material";
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
    <div className="inline-flex items-center rounded-full bg-[rgba(25,8,10,0.64)] p-1">
      {languages.map((lang) => {
        const isActive = currentLang === lang.code;

        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleChangeLang(lang.code)}
            className={`inline-flex h-8 min-w-[2.8rem] items-center justify-center rounded-full px-3 font-cormorant text-base tracking-wide transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-r from-[#ff7485] to-[#df5065] text-white shadow-[0_8px_16px_rgba(212,71,91,0.35)]"
                : "text-[#f0c89c] hover:bg-white/[0.08] hover:text-white"
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
  popper: {
    sx: {
      zIndex: 12050,
    },
  },
  tooltip: {
    sx: {
      bgcolor: "rgba(18, 4, 7, 0.98)",
      color: "#fff7ef",
      border: "1px solid rgba(255, 222, 207, 0.14)",
      borderRadius: "999px",
      px: 1.4,
      py: 0.7,
      fontSize: "0.78rem",
      fontWeight: 600,
      boxShadow: "0 16px 34px rgba(0,0,0,0.42)",
    },
  },
  arrow: {
    sx: {
      color: "rgba(18, 4, 7, 0.98)",
    },
  },
} as const;

function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
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
    to === "/" ? location.pathname === "/" : location.pathname === to || location.pathname.startsWith(`${to}/`);

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

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const handleProtectedRouteClick =
    () => (event: MouseEvent<HTMLAnchorElement>) => {
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

  const handleCloseProfileMenu = () => {
    setProfileMenuAnchor(null);
  };

  const handleNavigateFromProfileMenu = (to: string) => {
    handleCloseProfileMenu();
    navigate(to);
  };

  const handleLogoutFromProfileMenu = async () => {
    handleCloseProfileMenu();
    await logout();
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[9999] transition-all duration-500 ${
          scrolled
            ? "bg-[rgba(18,4,7,0.36)] shadow-[0_10px_28px_rgba(0,0,0,0.18)]"
            : "bg-[rgba(18,4,7,0.18)] shadow-none lg:bg-transparent"
        }`}
      >
        <div className="relative z-20 mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
          {/* Logo */}
          <Link to="/" className="group flex items-center">
            <div className="relative h-18 w-30 overflow-hidden sm:h-22 sm:w-36">
              <img
                src={headerLogo}
                alt="Muslima Boutique logo"
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full scale-[1.75] object-cover transition duration-500 group-hover:scale-[1.85]"
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = isNavActive(item.to);

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={`group relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    active
                      ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,210,210,0.12)]"
                      : "text-[#f7d6d2] hover:text-white"
                  }`}
                >
                  {t(item.label)}
                  <span
                    className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#ff7e8d] to-[#df5065] transition-all duration-300 ${
                      active ? "w-[64%]" : "w-0 group-hover:w-[70%]"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />

            <Tooltip
              title={t("header.wishlist")}
              arrow
              placement="bottom"
              slotProps={tooltipSlotProps}
            >
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

            <Tooltip
              title={t("header.cart")}
              arrow
              placement="bottom"
              slotProps={tooltipSlotProps}
            >
              <Link
                to="/cart"
                onClick={handleProtectedRouteClick()}
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  cartActive
                    ? "border border-[#ff4d6a]/30 bg-[#ff4d6a]/10 text-[#ff8ca0] shadow-[0_0_20px_rgba(255,106,130,0.25)]"
                    : "text-[#e7c39d] hover:text-[#ffe1ba]"
                }`}
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
                <Tooltip
                  title={t("header.openMenu")}
                  arrow
                  placement="bottom"
                  slotProps={tooltipSlotProps}
                >
                  <button
                    type="button"
                    onClick={handleOpenProfileMenu}
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
                        background:
                          "linear-gradient(135deg, #b1846a 0%, #6d4032 100%)",
                        border: "1px solid rgba(255, 232, 209, 0.35)",
                      }}
                    >
                      {user.avatar_url ? undefined : userInitials}
                    </Avatar>
                    <span className="font-cormorant text-xl text-[#f0c89c]">
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
                        border: "1px solid rgba(180, 95, 100, 0.25)",
                        background:
                          "linear-gradient(160deg, rgba(28, 8, 12, 0.98) 0%, rgba(12, 3, 5, 0.98) 100%)",
                        backdropFilter: "blur(32px)",
                        color: "#fff6f4",
                        boxShadow:
                          "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,200,200,0.04) inset",
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
                          borderLeft: "1px solid rgba(180, 95, 100, 0.25)",
                          borderTop: "1px solid rgba(180, 95, 100, 0.25)",
                        },
                      },
                    },
                  }}
                >
                  {/* User header card */}
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
                          background:
                            "linear-gradient(135deg, #c49a82 0%, #8c5c4a 100%)",
                          border: "2px solid rgba(255, 232, 209, 0.2)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        }}
                      >
                        {user.avatar_url ? undefined : userInitials}
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-cormorant text-lg font-semibold leading-tight text-[#f0d5c5]">
                          {user.full_name || "User"}
                        </span>
                        <span className="text-xs text-[#b0877a] mt-0.5">
                          {getRoleLabel(primaryRole, t)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Divider
                    sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 2 }}
                  />

                  {/* Menu items */}
                  <div className="py-1.5">
                    {primaryRole === "admin" ? (
                      <MenuItem
                        onClick={() => handleNavigateFromProfileMenu("/admin")}
                        sx={{
                          mx: 1,
                          my: 0.3,
                          borderRadius: "14px",
                          py: 1.2,
                          px: 2,
                          gap: 1.5,
                          color: "#f0d5c5",
                          fontSize: 14,
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, rgba(255,130,150,0.12) 0%, rgba(200,90,100,0.08) 100%)",
                            color: "#ffd4cc",
                          },
                        }}
                      >
                        <HiOutlineShieldCheck
                          size={20}
                          className="text-[#d47a7a]"
                        />
                        {t("header.adminPanel")}
                      </MenuItem>
                    ) : null}
                    {primaryRole === "owner" ? (
                      <MenuItem
                        onClick={() =>
                          handleNavigateFromProfileMenu("/owner/dashboard")
                        }
                        sx={{
                          mx: 1,
                          my: 0.3,
                          borderRadius: "14px",
                          py: 1.2,
                          px: 2,
                          gap: 1.5,
                          color: "#f0d5c5",
                          fontSize: 14,
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, rgba(255,130,150,0.12) 0%, rgba(200,90,100,0.08) 100%)",
                            color: "#ffd4cc",
                          },
                        }}
                      >
                        <HiOutlineChartBarSquare
                          size={20}
                          className="text-[#d47a7a]"
                        />
                        {t("header.ownerDashboard")}
                      </MenuItem>
                    ) : null}
                    <MenuItem
                      onClick={() => handleNavigateFromProfileMenu("/profile")}
                      sx={{
                        mx: 1,
                        my: 0.3,
                        borderRadius: "14px",
                        py: 1.2,
                        px: 2,
                        gap: 1.5,
                        color: "#f0d5c5",
                        fontSize: 14,
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, rgba(255,130,150,0.12) 0%, rgba(200,90,100,0.08) 100%)",
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
                        mx: 1,
                        my: 0.3,
                        borderRadius: "14px",
                        py: 1.2,
                        px: 2,
                        gap: 1.5,
                        color: "#f0d5c5",
                        fontSize: 14,
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, rgba(255,130,150,0.12) 0%, rgba(200,90,100,0.08) 100%)",
                          color: "#ffd4cc",
                        },
                      }}
                    >
                      <HiOutlineCog6Tooth
                        size={20}
                        className="text-[#d47a7a]"
                      />
                      {t("header.settings")}
                    </MenuItem>
                  </div>

                  <Divider
                    sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 2 }}
                  />

                  <div className="py-1.5 px-1 pb-2">
                    <MenuItem
                      onClick={handleLogoutFromProfileMenu}
                      sx={{
                        mx: 1,
                        my: 0.3,
                        borderRadius: "14px",
                        py: 1.2,
                        px: 2,
                        gap: 1.5,
                        color: "#e8a098",
                        fontSize: 14,
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, rgba(255,80,80,0.12) 0%, rgba(180,40,40,0.08) 100%)",
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
                <Tooltip
                  title={t("header.login")}
                  arrow
                  placement="bottom"
                  slotProps={tooltipSlotProps}
                >
                  <Link
                    to="/login"
                    aria-label={t("header.login")}
                    className="flex h-[56px] w-[56px] items-center justify-center rounded-full border border-[#e9b9a9]/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[#f4cfb9] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.09] hover:text-[#ffe8d8]"
                  >
                    <HiOutlineArrowRightOnRectangle size={22} />
                  </Link>
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
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d64f62] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(212,74,89,0.5)]">
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
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 isolate z-[10000] lg:hidden transition-opacity duration-300 ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          onClick={closeMobileMenu}
          aria-label={t("header.toggleMenu")}
        />

        <aside
          className={`absolute left-0 top-0 z-10 h-full w-[min(82vw,340px)] overflow-y-auto border-r border-[#7b3038]/70 bg-[linear-gradient(180deg,rgba(48,6,12,0.98),rgba(19,4,6,0.99))] shadow-[20px_0_60px_rgba(0,0,0,0.52)] transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex min-h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="flex items-center"
              >
                <div className="relative h-16 w-28 overflow-hidden">
                  <img loading="lazy" decoding="async"
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
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e6b0b4]">
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
                        animation: menuOpen
                          ? `fadeInUp 0.28s ease-out ${index * 0.045}s both`
                          : "none",
                      }}
                      onClick={closeMobileMenu}
                    >
                      <span>{t(item.label)}</span>
                      <span
                        className={`ml-auto h-2 w-2 rounded-full bg-[#e45768] transition-opacity duration-300 ${
                          active
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-60"
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
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d64f62] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(212,74,89,0.5)]">
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
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d64f62] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_rgba(212,74,89,0.5)]">
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
                          background:
                            "linear-gradient(135deg, #c49a82 0%, #8c5c4a 100%)",
                          border: "2px solid rgba(255, 232, 209, 0.16)",
                        }}
                      >
                        {user.avatar_url ? undefined : userInitials}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-cormorant text-lg font-semibold text-[#f4d8d0]">
                          {user.full_name || "User"}
                        </p>
                        <p className="text-xs text-[#b0877a]">
                          {getRoleLabel(primaryRole, t)}
                        </p>
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
                    className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#ff7485] to-[#df5065] px-4 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(212,71,91,0.25)] transition-all duration-300 active:scale-[0.98]"
                    onClick={closeMobileMenu}
                  >
                    {t("header.login")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
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
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default Header;
