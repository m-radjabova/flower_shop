import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HiChevronRight, HiHome, HiOutlineSparkles } from "react-icons/hi2";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type PremiumBreadcrumbProps = {
  items: BreadcrumbItem[];
};

function PremiumBreadcrumb({ items }: PremiumBreadcrumbProps) {
  const { t } = useTranslation();

  return (
    <nav aria-label="Breadcrumb" className="premium-breadcrumb group inline-flex max-w-full items-center">
      <div className="premium-breadcrumb__rail" />
      <ol className="relative z-10 flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border border-[#6a2a2f]/45 bg-[#120607]/75 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4ddd7] shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:gap-2 sm:px-3 sm:py-2 sm:text-xs">
        <li className="shrink-0">
          <Link
            to="/"
            className="premium-breadcrumb__home inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[#ffd7cf] transition-all duration-300 hover:border-[#ff9b88]/50 hover:bg-[#cb5c57]/20 hover:text-white sm:px-3"
          >
            <HiHome size={14} />
            <span className="max-w-[4.8rem] truncate">{t("header.home")}</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <HiChevronRight
                size={14}
                className="premium-breadcrumb__chevron shrink-0 text-[#9f5a53]"
                aria-hidden="true"
              />
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="premium-breadcrumb__link truncate rounded-full px-2.5 py-1.5 text-[#d8b2aa] transition-all duration-300 hover:bg-white/[0.06] hover:text-white sm:px-3"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="premium-breadcrumb__current max-w-[11rem] truncate rounded-full px-2.5 py-1.5 text-white sm:max-w-[18rem] sm:px-3">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}

        <li className="premium-breadcrumb__spark ml-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#cb5c57]/15 text-[#ffd2ca] sm:flex">
          <HiOutlineSparkles size={15} />
        </li>
      </ol>
    </nav>
  );
}

export default PremiumBreadcrumb;
