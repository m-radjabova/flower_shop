import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Drawer, IconButton, Tooltip } from "@mui/material";
import {
  HiBars3BottomLeft,
  HiMiniArrowLeftOnRectangle,
  HiMiniBuildingStorefront,
  HiMiniHome,
  HiMiniQueueList,
  HiMiniSquares2X2,
  HiMiniUsers,
  HiMiniXMark,
} from "react-icons/hi2";
import useContextPro from "../../hooks/useContextPro";
import type { UserRole } from "../../types/types";
import { getPrimaryRole, getUserRoleLabel, hasAnyRole } from "../../utils/roles";

const menuItems = [
  { label: "Dashboard", icon: HiMiniHome, to: "/admin", roles: ["admin"] },
  { label: "Users", icon: HiMiniUsers, to: "/admin/users", roles: ["admin"] },
  { label: "Shops", icon: HiMiniBuildingStorefront, to: "/admin/shops", roles: ["admin"] },
  { label: "Categories", icon: HiMiniSquares2X2, to: "/admin/categories", roles: ["admin"] },
  { label: "Applications", icon: HiMiniQueueList, to: "/admin/applications", roles: ["admin"] },
] satisfies Array<{
  label: string;
  icon: typeof HiMiniHome;
  to: string;
  roles: UserRole[];
}>;

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    logout,
    state: { user },
  } = useContextPro();
  const navigate = useNavigate();

  const role = getPrimaryRole(user) ?? "admin";
  const visibleMenuItems = menuItems.filter((item) => hasAnyRole(user, item.roles));

  const handleLogout = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await logout();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#140507_0%,#1b070b_42%,#0d0305_100%)] p-3 text-[#fff6f4]">
      <div className={`mb-6 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed ? (
          <div className="min-w-0 pr-3" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <p className="truncate text-[11px] uppercase tracking-[0.32em] text-[#b69088]">
              Muslima Boutique
            </p>
            <h2 className="mt-2 font-cormorant text-[2rem] leading-none text-white">
              {role === "owner" ? "Owner Panel" : "Admin Panel"}
            </h2>
            <p className="mt-1 text-xs text-[#bfa39d]">{getUserRoleLabel(user)}</p>
          </div>
        ) : null}

        <IconButton
          onClick={onToggle}
          aria-label={collapsed ? "Sidebarni ochish" : "Sidebarni yopish"}
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
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const navItem = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
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
              <span className={collapsed ? "hidden" : "block truncate"}>{item.label}</span>
            </NavLink>
          );

          return collapsed ? (
            <Tooltip key={item.to} title={item.label} placement="right" arrow>
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
                {isSubmitting ? "Chiqilmoqda..." : "Chiqish"}
              </span>
              <span className="mt-0.5 block truncate text-xs font-medium text-[#bfa39d]">
                {isSubmitting ? "Iltimos, biroz kuting" : "Hisobdan chiqish"}
              </span>
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5a2228] bg-[#1a090c]/95 text-[#fff6f4] shadow-lg backdrop-blur lg:hidden"
        aria-label="Admin menyusini ochish"
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
            aria-label="Menyuni yopish"
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
