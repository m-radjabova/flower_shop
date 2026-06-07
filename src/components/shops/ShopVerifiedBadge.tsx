import { HiCheckBadge } from "react-icons/hi2";

interface ShopVerifiedBadgeProps {
  className?: string;
  iconClassName?: string;
  title?: string;
}

function ShopVerifiedBadge({
  className = "",
  iconClassName = "",
  title = "Verified shop",
}: ShopVerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-[#4da3ff] ${className}`}
      title={title}
      aria-label={title}
    >
      <HiCheckBadge className={`h-full w-full drop-shadow-[0_0_10px_rgba(77,163,255,0.35)] ${iconClassName}`} />
    </span>
  );
}

export default ShopVerifiedBadge;
