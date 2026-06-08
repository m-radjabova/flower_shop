import type React from "react";
import i18next from "i18next";
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

export function getTabs(t: (key: string) => string) {
  return [
    { key: "profile", label: t("profile.myProfile"), icon: <HiOutlineUser /> },
    { key: "orders", label: t("profile.myOrders"), icon: <HiOutlineShoppingBag /> },
    { key: "favorites", label: t("profile.myFavorites"), icon: <HiOutlineHeart /> },
    { key: "addresses", label: t("profile.myAddresses"), icon: <HiOutlineMapPin /> },
    { key: "settings", label: t("profile.settings"), icon: <HiOutlineCog6Tooth /> },
  ] as Array<{ key: ProfileTab; label: string; icon: React.ReactNode }>;
}

function translateMethodValue(value: string) {
  const translationCandidates = [
    `delivery.${value}`,
    `profile.${value}`,
    `owner.${value}`,
    value,
  ];

  for (const key of translationCandidates) {
    const translated = i18next.t(key);
    if (translated !== key) {
      return translated.replace(/^[^\p{L}\p{N}]+/u, "").trim();
    }
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function getOrderStatusMeta(status: OrderOut["status"]) {
  switch (status) {
    case "new":
      return { label: i18next.t("profile.new"), className: "border-[#6b4f2f] bg-[#2a1b0e] text-[#f7cf9d]" };
    case "accepted":
      return { label: i18next.t("profile.accepted"), className: "border-[#4b5a73] bg-[#121c2d] text-[#a8c8ff]" };
    case "preparing":
      return { label: i18next.t("profile.preparing"), className: "border-[#7b5832] bg-[#2d1a0f] text-[#ffcf8c]" };
    case "delivering":
      return { label: i18next.t("profile.delivering"), className: "border-[#35626b] bg-[#10252a] text-[#8fe7ff]" };
    case "delivered":
      return { label: i18next.t("profile.deliveredDone"), className: "border-[#2f6a4f] bg-[#10231a] text-[#9ef0c2]" };
    case "cancelled":
      return { label: i18next.t("profile.cancelled"), className: "border-[#7a3542] bg-[#2a0f14] text-[#ff9eae]" };
    default:
      return { label: status, className: "border-[#704447] bg-[#2a1014] text-[#f4d8d2]" };
  }
}

export function getPaymentStatusMeta(status: OrderOut["payment_status"]) {
  switch (status) {
    case "paid":
      return { label: i18next.t("profile.paid"), className: "text-[#9ef0c2]" };
    case "pending":
      return { label: i18next.t("profile.pending"), className: "text-[#ffd39a]" };
    case "failed":
      return { label: i18next.t("profile.failed"), className: "text-[#ff9eae]" };
    default:
      return { label: status, className: "text-[#f4d8d2]" };
  }
}

export function getOrderEtaMeta(status: OrderOut["status"], createdAt: string) {
  const createdDate = new Date(createdAt);
  const elapsedMinutes = Number.isNaN(createdDate.getTime())
    ? null
    : Math.max(0, Math.round((Date.now() - createdDate.getTime()) / (60 * 1000)));

  switch (status) {
    case "new":
      return {
        label: i18next.t("profile.queued"),
        hint: elapsedMinutes !== null ? `${elapsedMinutes} ${i18next.t("profile.minutesAgoSuffix")}` : i18next.t("profile.justReceived"),
        className: "border-[#7b5832] bg-[#2d1a0f] text-[#ffcf8c]",
      };
    case "accepted":
      return {
        label: i18next.t("profile.accepted"),
        hint: i18next.t("profile.eta15to25"),
        className: "border-[#4b5a73] bg-[#121c2d] text-[#a8c8ff]",
      };
    case "preparing":
      return {
        label: i18next.t("profile.preparing"),
        hint: i18next.t("profile.eta10to20"),
        className: "border-[#7b5832] bg-[#2d1a0f] text-[#ffcf8c]",
      };
    case "delivering":
      return {
        label: i18next.t("profile.delivering"),
        hint: i18next.t("profile.eta5to15"),
        className: "border-[#35626b] bg-[#10252a] text-[#8fe7ff]",
      };
    case "delivered":
      return {
        label: i18next.t("profile.deliveredDone"),
        hint: i18next.t("profile.completed"),
        className: "border-[#2f6a4f] bg-[#10231a] text-[#9ef0c2]",
      };
    case "cancelled":
      return {
        label: i18next.t("profile.cancelled"),
        hint: i18next.t("profile.noEta"),
        className: "border-[#7a3542] bg-[#2a0f14] text-[#ff9eae]",
      };
    default:
      return {
        label: status,
        hint: "",
        className: "border-[#704447] bg-[#2a1014] text-[#f4d8d2]",
      };
  }
}

export function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(i18next.language || "en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDeliveryMethod(value: string) {
  return translateMethodValue(value);
}

export function formatPaymentMethod(value: string) {
  return translateMethodValue(value);
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
