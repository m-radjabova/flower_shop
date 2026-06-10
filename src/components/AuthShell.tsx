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
}

function AuthShell({
  title,
  subtitle,
  backgroundImage,
  footer,
  children,
  panelPosition = "center",
}: AuthShellProps) {
  const { t } = useTranslation();
  const alignmentClass =
    panelPosition === "right"
      ? "justify-start"
      : panelPosition === "left"
        ? "justify-end"
        : "justify-center";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,139,160,0.14),transparent_40%),linear-gradient(180deg,rgba(12,4,6,0.3),rgba(12,4,6,0.62))]" />
      <ProgressiveImage
        src={backgroundImage}
        alt=""
        priority="high"
        wrapperClassName="absolute inset-0"
        className="h-full w-full object-cover object-[72%_center] lg:object-right"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,4,6,0.18),rgba(12,4,6,0.52))]" />

      <div className={`relative z-10 mx-auto flex w-full max-w-7xl ${alignmentClass} lg:px-8`}>
        <div className="relative w-full max-w-[470px] rounded-[2rem] border border-[#703038]/70 bg-[linear-gradient(180deg,rgba(25,8,10,0.96),rgba(17,5,7,0.98))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ff8ea0]/40 to-transparent" />

          <div className="mt-8 text-center">
            <h1 className="font-cormorant text-[2.75rem] font-semibold leading-none tracking-tight text-white sm:text-5xl">
              {t(title) || title}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#d8b1ae]">{t(subtitle) || subtitle}</p>
          </div>

          <div className="mt-8">{children}</div>

          <div className="mt-8 text-center text-sm text-[#d8b1ae]">{footer}</div>
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
