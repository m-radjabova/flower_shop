import { useTranslation } from "react-i18next";

interface GiftMessageCardProps {
  message: string;
  className?: string;
  compact?: boolean;
}

function buildDecoratedPreview(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return "";

  return trimmed;
}

function GiftMessageCard({ message, className = "", compact = false }: GiftMessageCardProps) {
  const { t } = useTranslation();
  const trimmed = message.trim();
  if (!trimmed) return null;

  const previewText = buildDecoratedPreview(trimmed);

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.8rem] border border-[#ce4a60]/25 bg-[linear-gradient(160deg,rgba(33,8,14,0.97),rgba(18,4,8,0.99))] shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(206,74,96,0.08)] transition-all duration-500 hover:shadow-[0_25px_60px_rgba(206,74,96,0.12)] ${compact ? "p-3" : "p-5 sm:p-6"} ${className}`.trim()}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -inset-1 rounded-[1.8rem] bg-gradient-to-br from-[#ce4a60]/8 via-transparent to-[#ffd700]/3 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#ce4a60]/10 blur-[50px]" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#ffd700]/5 blur-[40px]" />

      <div className="relative">
        {/* ── Header with ribbon accent ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Heart icon with glow */}
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(206,74,96,0.2),rgba(206,74,96,0.05))] shadow-[0_0_12px_rgba(206,74,96,0.15)]">
              <span className="absolute inset-0 animate-pulse rounded-full bg-[#ce4a60]/10" />
              <span className="relative text-sm" aria-hidden="true">💝</span>
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#f0b8c5]">{t("checkout.giftMessage")}</p>
              <div className="mt-0.5 h-px w-10 bg-gradient-to-r from-[#ce4a60]/60 to-transparent" />
            </div>
          </div>

          {/* Decorative wax seal */}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ce4a60]/30 shadow-[0_0_6px_rgba(206,74,96,0.15)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#ffd700]/20" />
          </div>
        </div>

        {/* ── Top decorative flourish ── */}
        <div className="relative mt-3 flex items-center justify-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ce4a60]/15 to-transparent" />
          <span className="text-[10px] text-[#ce4a60]/30">✦</span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ce4a60]/15 to-transparent" />
        </div>

        {/* ── Letter / message body ── */}
        <div className="relative mt-4 overflow-hidden rounded-[1.4rem] border border-[#ce4a60]/10 bg-[linear-gradient(145deg,rgba(255,241,245,0.04),rgba(255,255,255,0.01))] shadow-[inset_0_1px_0_rgba(255,241,245,0.06)]">
          {/* Decorative corner accents */}
          <div className="pointer-events-none absolute left-3 top-3 text-[8px] text-[#ce4a60]/20">⌜</div>
          <div className="pointer-events-none absolute right-3 top-3 text-[8px] text-[#ce4a60]/20">⌝</div>
          <div className="pointer-events-none absolute bottom-3 left-3 text-[8px] text-[#ce4a60]/20">⌞</div>
          <div className="pointer-events-none absolute bottom-3 right-3 text-[8px] text-[#ce4a60]/20">⌟</div>

          {/* Subtle ruled lines background */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
            <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_28px,rgba(206,74,96,0.3)_28px,rgba(206,74,96,0.3)_29px)]" />
          </div>

          <div className={`relative ${compact ? "px-4 py-3" : "px-5 py-5 sm:px-7 sm:py-6"}`}>
            {/* Opening heart flourish */}
            <div className="mb-3 flex items-center gap-2 text-[#ce4a60]/40">
              <span className="text-xs">♡</span>
              <span className="h-px flex-1 bg-gradient-to-r from-[#ce4a60]/20 to-transparent" />
            </div>

            {/* The message */}
            <p className={`font-cormorant leading-[1.7] tracking-wide text-[#fff6f5] ${compact ? "text-base" : "text-[1.2rem] sm:text-[1.35rem]"}`}>
              <span className="text-[#ce4a60]/60">"</span>
              {previewText}
              <span className="text-[#ce4a60]/60">"</span>
            </p>

            {/* Signature flourish */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <span className="h-px w-12 bg-gradient-to-l from-[#ce4a60]/20 to-transparent" />
              <span className="font-cormorant text-xs italic tracking-[0.15em] text-[#ce4a60]/40">♡</span>
              <span className="h-px w-6 bg-gradient-to-l from-[#ffd700]/15 to-transparent" />
            </div>
          </div>
        </div>

        {/* ── Bottom decorative ribbon ── */}
        <div className="relative mt-3 flex items-center justify-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ffd700]/10 to-transparent" />
          <div className="flex gap-1">
            <span className="text-[8px] text-[#ce4a60]/25">✦</span>
            <span className="text-[8px] text-[#ffd700]/20">✦</span>
            <span className="text-[8px] text-[#ce4a60]/25">✦</span>
          </div>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ffd700]/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}

export default GiftMessageCard;