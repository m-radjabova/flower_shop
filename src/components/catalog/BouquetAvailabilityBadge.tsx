import { useTranslation } from "react-i18next";
import type { Bouquet } from "../../types/catalog";
import { getBouquetAvailability } from "../../utils/catalog";

interface BouquetAvailabilityBadgeProps {
  bouquet: Pick<Bouquet, "stock" | "status">;
  compact?: boolean;
  className?: string;
}

function BouquetAvailabilityBadge({ bouquet, compact = false, className = "" }: BouquetAvailabilityBadgeProps) {
  const { t } = useTranslation();
  const availability = getBouquetAvailability(bouquet);

  const toneClassName =
    availability.tone === "out"
      ? "border-[#a84755]/35 bg-[#2a0d12]/82 text-[#ffc5ce]"
      : availability.tone === "low"
        ? "border-[#f2b36e]/35 bg-[#2a1408]/82 text-[#ffe1b8]"
        : "border-[#56b88b]/35 bg-[#0f2119]/82 text-[#c8ffe5]";

  const dotClassName =
    availability.tone === "out"
      ? "bg-[#ff7f92]"
      : availability.tone === "low"
        ? "bg-[#ffc067]"
        : "bg-[#62d69c]";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border ${compact ? "px-2.5 py-1 text-[0.6rem]" : "px-3 py-1.5 text-[0.65rem]"} font-bold uppercase tracking-[0.14em] shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md ${toneClassName} ${className}`.trim()}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} />
      {availability.count ? t(availability.labelKey, { count: availability.count }) : t(availability.labelKey)}
    </span>
  );
}

export default BouquetAvailabilityBadge;
