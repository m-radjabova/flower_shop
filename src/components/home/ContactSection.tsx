import {
  HiArrowUpRight,
  HiMapPin,
  HiOutlineEnvelope,
  HiOutlinePhone,
} from "react-icons/hi2";
import { FaInstagram, FaTelegramPlane } from "react-icons/fa";

const contactCards = [
  {
    icon: HiOutlinePhone,
    label: "Call Us",
    value: "+998 90 123 45 67",
    href: "tel:+998901234567",
  },
  {
    icon: HiOutlineEnvelope,
    label: "Email",
    value: "hello@muslimaflowers.uz",
    href: "mailto:hello@muslimaflowers.uz",
  },
  {
    icon: HiMapPin,
    label: "Visit Studio",
    value: "Tashkent, Yunusabad District",
    href: "https://maps.google.com/?q=Tashkent,Yunusabad",
  },
];

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "#about" },
  { label: "Bouquets", href: "#bouquets" },
  { label: "Contact", href: "#contact" },
];

const socials = [
  { label: "Instagram", href: "https://instagram.com", icon: FaInstagram },
  { label: "Telegram", href: "https://t.me", icon: FaTelegramPlane },
];

function ContactSection() {
  return (
    <footer
      id="contact"
      className="relative scroll-mt-28 overflow-hidden px-4 pb-5 pt-10 sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] sm:px-7 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr_0.9fr] lg:items-start">
          <div className="max-w-md">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-[#cfa286]">
              Contact
            </p>
            <h2 className="mt-2 font-cormorant text-[2.45rem] leading-[0.95] text-[#fff0e8] sm:text-[3rem]">
              Muslima Flower Boutique
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#d8beb7]">
              Custom floral styling, romantic deliveries, and elegant bouquets for meaningful
              moments.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {socials.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[#f0b49f]/10 bg-[#210b0d]/80 px-4 text-xs font-semibold text-[#f4dfd7] shadow-[0_10px_26px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:border-[#f0b49f]/25 hover:bg-[#2b0d10] hover:text-white"
                  >
                    <Icon className="text-[#e8ab97]" />
                    {social.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-row-3 lg:pt-1">
            {contactCards.map((card) => {
              const Icon = card.icon;

              return (
                <a
                  key={card.label}
                  href={card.href}
                  target={card.href.startsWith("http") ? "_blank" : undefined}
                  rel={card.href.startsWith("http") ? "noreferrer" : undefined}
                  className="group rounded-2xl border border-[#f2c6b3]/10 bg-[#160708]/70 px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-[#f2c6b3]/20 hover:bg-[#220b0d]/82"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#260d0f] text-[#f1b19f]">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.23em] text-[#b98d85]">
                        {card.label}
                      </p>
                      <p className="mt-1.5 break-words text-[0.98rem] font-semibold leading-snug text-[#fff1ea]">
                        {card.value}
                      </p>
                    </div>
                    <HiArrowUpRight className="mt-1 shrink-0 text-sm text-[#b77f76] transition group-hover:text-[#f1c1b4]" />
                  </div>
                </a>
              );
            })}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 lg:pl-2">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-[#cfa286]">
                Quick Links
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
              {quickLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[#edd7d0] transition hover:bg-[#230c0e]/80 hover:text-white"
                >
                  <span>{link.label}</span>
                  <HiArrowUpRight className="text-xs text-[#b77f76] transition group-hover:text-[#f1c1b4]" />
                </a>
              ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#f2c6b3]/10 bg-[#140607]/72 px-4 py-4">
              <p className="font-cormorant text-[1.7rem] leading-none text-[#f7e9e2]">
                Open Daily
              </p>
              <p className="mt-3 text-sm leading-6 text-[#d4b7b0]">
                09:00 AM - 10:00 PM
                <br />
                Same-day delivery available for selected bouquets.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[#f2c6b3]/10 pt-4 text-xs text-[#b9948e] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Muslima Flower Boutique. Crafted with romance and elegance.</p>
          <div className="flex items-center gap-5">
            <a href="#about" className="transition hover:text-[#f0ded7]">
              About
            </a>
            <a href="#bouquets" className="transition hover:text-[#f0ded7]">
              Bouquets
            </a>
            <a href="#contact" className="transition hover:text-[#f0ded7]">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default ContactSection;
