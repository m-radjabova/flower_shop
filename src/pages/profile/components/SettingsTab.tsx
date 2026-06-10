import { useTranslation } from "react-i18next";
import {
  HiIdentification,
  HiOutlineCog6Tooth,
  HiOutlineEnvelope,
  HiOutlineKey,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineUser,
} from "react-icons/hi2";
import type { UseFormReturn } from "react-hook-form";

interface AccountFormState {
  full_name: string;
  email: string;
  phone: string;
}

interface PasswordFormState {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface SettingsTabProps {
  accountForm: UseFormReturn<AccountFormState>;
  canManageAddresses?: boolean;
  onAccountSave: () => void;
  onManageAddresses: () => void;
  onPasswordSave: () => void;
  onResetAccountForm: () => void;
  passwordForm: UseFormReturn<PasswordFormState>;
  profileCompletion: number;
}

function SettingsTab({
  accountForm,
  canManageAddresses = true,
  onAccountSave,
  onManageAddresses,
  onPasswordSave,
  onResetAccountForm,
  passwordForm,
  profileCompletion,
}: SettingsTabProps) {
  const { t } = useTranslation(undefined, { keyPrefix: "profile" });
  const accountRegister = accountForm.register;
  const passwordRegister = passwordForm.register;

  return (
    <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="font-cormorant text-3xl text-white sm:text-4xl">{t("settings")}</p>
          <p className="mt-1 max-w-2xl text-sm text-[#d8beb8] sm:mt-3">{t("settingsDesc")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/8 bg-[#140709] px-3 py-2 sm:px-4 sm:py-3 sm:gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2a0f14] text-[#ffb1bd] sm:h-11 sm:w-11">
              <HiOutlineCog6Tooth className="text-base sm:text-xl" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#b7918a] sm:text-xs">{t("liveProfile")}</p>
              <p className="mt-0.5 text-lg font-semibold text-white sm:mt-1 sm:text-2xl">{profileCompletion}%</p>
            </div>
          </div>
          {canManageAddresses ? (
            <button
              type="button"
              onClick={onManageAddresses}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-[#2a0f12] px-3 text-xs font-semibold text-[#f3d6d0] transition hover:bg-[#381419] sm:h-11 sm:px-5 sm:text-sm"
            >
              {t("manageAddresses")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-5">
        <section className="rounded-[1.4rem] border border-white/8 bg-[#120607] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#2a1014] text-[#ffb1bd] sm:h-11 sm:w-11">
                <HiIdentification className="text-base sm:text-xl" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-white sm:text-2xl">{t("accountInformation")}</p>
                <p className="mt-0.5 max-w-xl text-xs leading-5 text-[#c9aba4] sm:mt-1 sm:text-sm sm:leading-6">{t("accountInfoDesc")}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-[#301014] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ff9eae] sm:px-3 sm:py-1 sm:text-[11px]">
              {t("liveProfile")}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("fullName")}</span>
              <div className="flex h-11 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-3 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10] sm:h-12 sm:px-4">
                <HiOutlineUser className="mr-2 shrink-0 text-base text-[#d6a6a0] sm:mr-3 sm:text-lg" />
                <input
                  {...accountRegister("full_name")}
                  placeholder={t("fullName")}
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8f6d68] sm:text-base"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("email")}</span>
              <div className="flex h-11 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-3 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10] sm:h-12 sm:px-4">
                <HiOutlineEnvelope className="mr-2 shrink-0 text-base text-[#d6a6a0] sm:mr-3 sm:text-lg" />
                <input
                  type="email"
                  {...accountRegister("email")}
                  placeholder={t("email")}
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8f6d68] sm:text-base"
                />
              </div>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("phone")}</span>
              <div className="flex h-11 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-3 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10] sm:h-12 sm:px-4">
                <HiOutlinePhone className="mr-2 shrink-0 text-base text-[#d6a6a0] sm:mr-3 sm:text-lg" />
                <input
                  {...accountRegister("phone")}
                  placeholder={t("phonePlaceholder")}
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8f6d68] sm:text-base"
                />
              </div>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4 sm:mt-5 sm:gap-3 sm:pt-5">
            <button
              type="button"
              onClick={onAccountSave}
              className="inline-flex h-10 min-w-[130px] items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-4 text-sm font-semibold text-white transition hover:brightness-105 sm:h-11 sm:min-w-[152px] sm:px-5"
            >
              {t("saveProfile")}
            </button>
            <button
              type="button"
              onClick={onResetAccountForm}
              className="inline-flex h-10 min-w-[100px] items-center justify-center rounded-xl border border-white/8 bg-[#2a0f12] px-4 text-sm font-semibold text-[#f3d6d0] transition hover:bg-[#381419] sm:h-11 sm:min-w-[120px] sm:px-5"
            >
              {t("reset")}
            </button>
          </div>
        </section>
      </div>

      <div className="mt-4 sm:mt-5">
        <section className="rounded-[1.4rem] border border-white/8 bg-[#120607] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2a1014] text-[#ffb1bd] sm:h-11 sm:w-11">
              <HiOutlineKey className="text-base sm:text-xl" />
            </span>
            <div>
              <p className="text-lg font-semibold text-white sm:text-2xl">{t("security")}</p>
              <p className="mt-0.5 text-xs text-[#c9aba4] sm:mt-1 sm:text-sm">{t("securityDesc")}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("currentPassword")}</span>
              <div className="flex h-11 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-3 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10] sm:h-12 sm:px-4">
                <HiOutlineShieldCheck className="mr-2 shrink-0 text-base text-[#d6a6a0] sm:mr-3 sm:text-lg" />
                <input
                  type="password"
                  {...passwordRegister("current_password")}
                  placeholder={t("currentPasswordPlaceholder")}
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8f6d68] sm:text-base"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("newPassword")}</span>
              <div className="flex h-11 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-3 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10] sm:h-12 sm:px-4">
                <HiOutlineKey className="mr-2 shrink-0 text-base text-[#d6a6a0] sm:mr-3 sm:text-lg" />
                <input
                  type="password"
                  {...passwordRegister("new_password")}
                  placeholder={t("newPasswordPlaceholder")}
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8f6d68] sm:text-base"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#f1d5cb] sm:mb-2 sm:text-sm">{t("confirmNewPassword")}</span>
              <div className="flex h-11 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-3 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10] sm:h-12 sm:px-4">
                <HiOutlineKey className="mr-2 shrink-0 text-base text-[#d6a6a0] sm:mr-3 sm:text-lg" />
                <input
                  type="password"
                  {...passwordRegister("confirm_password")}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-[#8f6d68] sm:text-base"
                />
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={onPasswordSave}
            className="mt-4 inline-flex h-10 min-w-[150px] items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-4 text-sm font-semibold text-white transition hover:brightness-105 sm:mt-5 sm:h-11 sm:min-w-[170px] sm:px-5"
          >
            {t("updatePassword")}
          </button>
        </section>
      </div>
    </div>
  );
}

export default SettingsTab;
