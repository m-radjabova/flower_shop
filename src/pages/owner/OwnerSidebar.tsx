import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Drawer, IconButton, Tooltip } from "@mui/material";
import {
  HiBars3BottomLeft,
  HiMiniArrowLeftOnRectangle,
  HiMiniBuildingStorefront,
  HiMiniChatBubbleBottomCenterText,
  HiMiniGift,
  HiMiniHome,
  HiMiniQueueList,
  HiMiniXMark,
} from "react-icons/hi2";
import useContextPro from "../../hooks/useContextPro";

const menuItems = [
  { labelKey: "owner.dashboard", icon: HiMiniHome, to: "/owner/dashboard" },
  { labelKey: "owner.myShop", icon: HiMiniBuildingStorefront, to: "/owner/shop" },
  { labelKey: "owner.bouquetsControl", icon: HiMiniGift, to: "/owner/bouquets" },
  { labelKey: "owner.orders", icon: HiMiniQueueList, to: "/owner/orders" },
  { labelKey: "owner.reviewsControl", icon: HiMiniChatBubbleBottomCenterText, to: "/owner/reviews" },
  { labelKey: "owner.support", icon: HiMiniChatBubbleBottomCenterText, to: "/owner/support" },
];

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    logout,
    state: { user },
  } = useContextPro();

  const handleLogout = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await logout();
    } finally {
      setIsSubmitting(false);
    }
  };


  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#140507_0%,#1b070b_42%,#0d0305_100%)] p-3 text-[#fff6f4]">
      <div className={`mb-6 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed ? (
          <div className="min-w-0 pr-3" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <p className="truncate text-[11px] uppercase tracking-[0.32em] text-[#b69088]">{t("owner.brandName")}</p>
            <h2 className="mt-2 font-cormorant text-[2rem] leading-none text-white">{t("owner.ownerPanel")}</h2>
            <p className="mt-1 text-xs text-[#bfa39d]">{user?.full_name}</p>
          </div>
        ) : null}

        <IconButton
          onClick={onToggle}
          aria-label={collapsed ? t("owner.sidebarToggleOpen") : t("owner.sidebarToggleClose")}
          sx={{
            color: "#fff6f4",
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: "16px",
            width: 42,
            height: 42,
            "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
          }}
        >
          <HiBars3BottomLeft size={20} />
        </IconButton>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const navItem = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/owner/dashboard"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex min-h-14 items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  collapsed ? "justify-center" : "gap-3"
                } ${
                  isActive
                    ? "bg-[linear-gradient(135deg,#b11f32,#d43d53)] text-white shadow-[0_18px_34px_rgba(193,39,63,0.28)]"
                    : "text-[#e4cbc5] hover:bg-white/[0.06] hover:text-white"
                }`
              }
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition group-hover:border-white/20 group-hover:bg-white/10">
                <Icon className="shrink-0 text-[22px]" />
              </span>
              <span className={collapsed ? "hidden" : "block truncate"}>{t(item.labelKey)}</span>
            </NavLink>
          );

          return collapsed ? (
            <Tooltip key={item.to} title={t(item.labelKey)} placement="right" arrow>
              <div>{navItem}</div>
            </Tooltip>
          ) : navItem;
        })}
      </nav>

      <div className="pt-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isSubmitting}
          className={`group relative flex w-full items-center overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(35,10,13,0.98),rgba(20,6,8,0.92))] text-left text-white shadow-[0_20px_48px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cf5a6a]/35 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 ${
            collapsed ? "h-14 justify-center px-0" : "min-h-[72px] gap-4 px-4 py-3"
          }`}
        >
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,transparent,rgba(239,68,68,0.12))] opacity-90 transition-opacity duration-300 group-hover:opacity-100 group-disabled:opacity-60" />
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            {isSubmitting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <HiMiniArrowLeftOnRectangle className="text-[22px]" />
            )}
          </span>
          {!collapsed ? (
            <span className="relative min-w-0 flex-1">
              <span className="block truncate text-base font-black tracking-tight">
                {isSubmitting ? t("owner.loggingOut") : t("owner.logout")}
              </span>
              <span className="mt-0.5 block truncate text-xs font-medium text-[#bfa39d]">
                {isSubmitting ? t("owner.pleaseWait") : t("owner.logoutAccount")}
              </span>
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}

export default function OwnerSidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5a2228] bg-[#1a090c]/95 text-[#fff6f4] shadow-lg backdrop-blur lg:hidden"
        aria-label={t("owner.openMenuLabel")}
      >
        <HiBars3BottomLeft size={20} />
      </button>

      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-[#371318] bg-[#0c0304] shadow-xl transition-all duration-300 ease-in-out lg:block ${
          collapsed ? "w-24" : "w-72"
        }`}
      >
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      </aside>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: "min(320px, 86vw)",
              background: "transparent",
              boxShadow: "none",
            },
          },
        }}
      >
        <div className="relative h-full">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white"
            aria-label={t("owner.sidebarToggleClose")}
          >
            <HiMiniXMark size={22} />
          </button>
          <SidebarContent
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </Drawer>
    </>
  );
}
