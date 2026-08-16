import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import ProgressiveImage from "./ProgressiveImage";

interface AuthShellProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  footer: ReactNode;
  children: ReactNode;
  panelPosition?: "left" | "center" | "right";
  backgroundAsCss?: boolean;
  panelClassName?: string;
}

function AuthShell({
  title,
  subtitle,
  backgroundImage,
  footer,
  children,
  panelPosition = "center",
  backgroundAsCss = false,
  panelClassName,
}: AuthShellProps) {
  const { t } = useTranslation();
  const alignmentClass =
    panelPosition === "right"
      ? "justify-start"
      : panelPosition === "left"
        ? "justify-end"
        : "justify-center";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-visible px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,139,160,0.16),transparent_42%),linear-gradient(180deg,rgba(12,4,6,0.25),rgba(12,4,6,0.66))]" />
      {backgroundAsCss ? (
        <div
          className="absolute inset-0 bg-cover bg-[70%_center] bg-no-repeat lg:bg-right"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          aria-hidden="true"
        />
      ) : (
        <ProgressiveImage
          src={backgroundImage}
          alt=""
          priority="high"
          wrapperClassName="absolute inset-0"
          className="h-full w-full object-cover object-[70%_center] lg:object-right"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,3,7,0.28),rgba(9,3,7,0.62))]" />

      <div className={`relative z-10 mx-auto flex w-full max-w-7xl ${alignmentClass} lg:px-8`}>
        <div
          className={`relative z-40 w-full max-w-[470px] rounded-[2rem] border border-white/[0.08] bg-[#14060b]/85 p-7 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl pointer-events-auto sm:p-9 ${panelClassName ?? ""}`}
          style={{ isolation: "isolate" }}
        >
          {/* Gradient top hairline */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-[#ff8ea0]/60 to-transparent" />

          {/* Ambient glows */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#ff6b7e]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-[#ff8fa0]/[0.08] blur-3xl" />

          <header className="mt-10 text-center">
            <h1 className="font-display bg-gradient-to-r from-[#fff] via-[#ffd7dc] to-[#ff9aa8] bg-clip-text text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-transparent sm:text-[2.85rem]">
              {t(title) || title}
            </h1>
            <div className="mt-4 flex items-center justify-center gap-2" aria-hidden="true">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#ff6b7e]/50" />
              <span className="h-1.5 w-1.5 rotate-45 bg-gradient-to-br from-[#ff6b7e] to-[#ff8fa0]" />
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#ff6b7e]/50" />
            </div>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#d8b1ae]">{t(subtitle) || subtitle}</p>
          </header>

          <div className="relative z-30 mt-9">{children}</div>

          <footer className="relative z-30 mt-9 text-center text-sm text-[#d8b1ae]">
            <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="mt-5 block">{footer}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
