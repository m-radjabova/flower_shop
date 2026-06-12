import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineHome,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineClock,
} from "react-icons/hi2";

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const quickLinks = [
    { label: t("footer.home"), href: "/", icon: HiOutlineHome },
    { label: t("footer.bouquets"), href: "/bouquets", icon: HiOutlineHeart },
    { label: t("footer.shops"), href: "/shops", icon: HiOutlineShoppingBag },
    { label: t("footer.aboutUs"), href: "/about-us", icon: HiOutlineHeart },
    { label: t("footer.favorites"), href: "/favorites", icon: HiOutlineHeart },
    { label: t("footer.cart"), href: "/cart", icon: HiOutlineShoppingBag },
  ];

  const contactInfo = [
    {
      icon: HiOutlinePhone,
      label: t("contact.callUs"),
      value: "+998 90 123 45 67",
      href: "tel:+998901234567",
    },
    {
      icon: HiOutlineEnvelope,
      label: t("contact.email"),
      value: "hello@muslima.uz",
      href: "mailto:hello@muslima.uz",
    },
    {
      icon: HiOutlineMapPin,
      label: t("contact.visitStudio"),
      value: t("contact.serviceArea"),
    },
    {
      icon: HiOutlineClock,
      label: t("contact.openDaily"),
      value: t("contact.workingHours"),
    },
  ];

  const socialLinks = [
    {
      name: "Instagram",
      href: "https://instagram.com/muslima_boutique",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      href: "https://t.me/muslima_boutique",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="relative z-10 overflow-hidden border-t border-[#5c2529]/50 bg-[rgba(8,2,4,0.85)] backdrop-blur-md">
      {/* Top decorative gradient line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#ff7485]/50 to-transparent" />

      {/* Subtle glow behind */}
      <div className="pointer-events-none absolute -left-32 -top-20 h-48 w-96 rounded-full bg-[#9f1d2d]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 -bottom-20 h-48 w-96 rounded-full bg-[#6d2c35]/10 blur-[100px]" />
      <div className="mx-auto w-full px-4 pt-12 pb-6 sm:px-6 lg:px-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff7485] to-[#df5065] shadow-[0_4px_12px_rgba(212,71,91,0.25)]">
                <span className="font-cormorant text-lg font-bold text-white">M</span>
              </div>
              <span className="font-cormorant text-xl font-semibold tracking-wide text-[#f0d5c5]">
                Muslima Boutique
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#c9a79e]/80">
              {t("contact.description")}
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2.5 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#87404a]/40 bg-white/[0.04] text-[#f0c89c] transition-all duration-300 hover:border-[#df5065]/50 hover:bg-[#df5065]/10 hover:text-[#ff7485] hover:shadow-[0_0_20px_rgba(223,80,101,0.15)] active:scale-90"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-cormorant text-lg font-semibold tracking-wide text-[#f0d5c5]">
              {t("contact.quickLinks")}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="group inline-flex items-center gap-2.5 text-sm text-[#c9a79e]/80 transition-all duration-300 hover:text-[#ffccd1]"
                  >
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#df5065]/60 transition-all duration-300 group-hover:bg-[#ff7485] group-hover:shadow-[0_0_8px_rgba(223,80,101,0.5)]" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="font-cormorant text-lg font-semibold tracking-wide text-[#f0d5c5]">
              {t("contact.contact")}
            </h3>
            <ul className="flex flex-col gap-3">
              {contactInfo.map((item) => (
                <li key={item.label}>
                  <div className="group flex items-start gap-3 text-sm text-[#c9a79e]/80">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#df5065]/70 transition-colors duration-300 group-hover:text-[#ff7485]" />
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-[0.08em] text-[#a0786e]/60">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-[#e0bcb4]">
                        {item.value}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Info */}
          <div className="flex flex-col gap-4">
            <h3 className="font-cormorant text-lg font-semibold tracking-wide text-[#f0d5c5]">
              {t("contact.deliveryInfo")}
            </h3>
            <div className="flex flex-col gap-3 rounded-xl border border-[#87404a]/25 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#df5065]/10 text-[#ff7485]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx={12} cy={10} r={3} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#e0bcb4]">
                  {t("contact.openDaily")}
                </span>
              </div>
              <p className="text-sm text-[#c9a79e]/70">
                {t("contact.workingHours")}
              </p>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#87404a]/30 to-transparent" />
              <p className="text-xs leading-relaxed text-[#c9a79e]/60">
                {t("contact.deliveryInfo")}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div className="relative mt-10 mb-6">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#87404a]/30 to-transparent" />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#c9a79e]/50">
            © {year} {t("footer.rights")}
          </p>

          {/* Footer nav pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#87404a]/20 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#c9a79e]/60 transition-all duration-300 hover:border-[#df5065]/30 hover:bg-[#df5065]/5 hover:text-[#ffccd1] active:scale-95"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Signature */}
        <div className="mt-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#c9a79e]/30">
            {t("contact.craftedWith")}{" "}
            <span className="inline-block animate-pulse text-[#ff7485]">♥</span>{" "}
            Muslima Boutique
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
