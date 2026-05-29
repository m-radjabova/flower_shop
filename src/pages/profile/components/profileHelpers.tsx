import type React from "react";
import {
  HiBuildingOffice2,
  HiHome,
  HiOutlineBuildingOffice2,
  HiOutlineCog6Tooth,
  HiOutlineHeart,
  HiOutlineHome,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
  HiOutlineUser,
} from "react-icons/hi2";
import type { OrderOut } from "../../../types/catalog";

export type ProfileTab = "profile" | "orders" | "favorites" | "addresses" | "settings";

export const tabs: Array<{ key: ProfileTab; label: string; icon: React.ReactNode }> = [
  { key: "profile", label: "My Profile", icon: <HiOutlineUser /> },
  { key: "orders", label: "My Orders", icon: <HiOutlineShoppingBag /> },
  { key: "favorites", label: "My Favorites", icon: <HiOutlineHeart /> },
  { key: "addresses", label: "My Addresses", icon: <HiOutlineMapPin /> },
  { key: "settings", label: "Settings", icon: <HiOutlineCog6Tooth /> },
];

export function getOrderStatusMeta(status: OrderOut["status"]) {
  switch (status) {
    case "new":
      return { label: "New", className: "border-[#6b4f2f] bg-[#2a1b0e] text-[#f7cf9d]" };
    case "accepted":
      return { label: "Accepted", className: "border-[#4b5a73] bg-[#121c2d] text-[#a8c8ff]" };
    case "preparing":
      return { label: "Preparing", className: "border-[#7b5832] bg-[#2d1a0f] text-[#ffcf8c]" };
    case "delivering":
      return { label: "Delivering", className: "border-[#35626b] bg-[#10252a] text-[#8fe7ff]" };
    case "delivered":
      return { label: "Delivered", className: "border-[#2f6a4f] bg-[#10231a] text-[#9ef0c2]" };
    case "cancelled":
      return { label: "Cancelled", className: "border-[#7a3542] bg-[#2a0f14] text-[#ff9eae]" };
    default:
      return { label: status, className: "border-[#704447] bg-[#2a1014] text-[#f4d8d2]" };
  }
}

export function getPaymentStatusMeta(status: OrderOut["payment_status"]) {
  switch (status) {
    case "paid":
      return { label: "Paid", className: "text-[#9ef0c2]" };
    case "pending":
      return { label: "Pending", className: "text-[#ffd39a]" };
    case "failed":
      return { label: "Failed", className: "text-[#ff9eae]" };
    default:
      return { label: status, className: "text-[#f4d8d2]" };
  }
}

export function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDeliveryMethod(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPaymentMethod(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function getRepeatOrderAvailability(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return {
      canRepeat: false,
      helperText: "Repeat order mavjud emas",
    };
  }

  const repeatWindowMs = 2 * 60 * 60 * 1000;
  const expiresAt = createdTime + repeatWindowMs;
  const remainingMs = expiresAt - Date.now();

  if (remainingMs <= 0) {
    return {
      canRepeat: false,
      helperText: "2 soatlik vaqt tugagan",
    };
  }

  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (hours > 0) {
    return {
      canRepeat: true,
      helperText: `${hours} soat ${minutes} daqiqa qoldi`,
    };
  }

  return {
    canRepeat: true,
    helperText: `${minutes} daqiqa qoldi`,
  };
}

export function getAddressTitleMeta(title: string) {
  const normalized = title.trim().toLowerCase();

  if (normalized.includes("home")) {
    return {
      icon: <HiHome className="text-xl" />,
      badgeClassName: "bg-[#21140f] text-[#ffd59a]",
    };
  }

  if (normalized.includes("office") || normalized.includes("work")) {
    return {
      icon: <HiBuildingOffice2 className="text-xl" />,
      badgeClassName: "bg-[#121d2c] text-[#a8c8ff]",
    };
  }

  if (normalized.includes("apartment") || normalized.includes("flat")) {
    return {
      icon: <HiOutlineBuildingOffice2 className="text-xl" />,
      badgeClassName: "bg-[#241523] text-[#f1b8ff]",
    };
  }

  return {
    icon: <HiOutlineHome className="text-xl" />,
    badgeClassName: "bg-[#2a0f14] text-[#ffb1bd]",
  };
}
