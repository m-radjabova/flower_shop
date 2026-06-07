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
    <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(27,8,10,0.95),rgba(12,3,4,0.96))] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-cormorant text-4xl text-white">{t("settings")}</p>
          <p className="mt-3 max-w-2xl text-[#d8beb8]">{t("settingsDesc")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-[#140709] px-4 py-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a0f14] text-[#ffb1bd]">
              <HiOutlineCog6Tooth className="text-xl" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#b7918a]">{t("liveProfile")}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{profileCompletion}%</p>
            </div>
          </div>
          {canManageAddresses ? (
            <button
              type="button"
              onClick={onManageAddresses}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2a0f12] px-5 font-semibold text-[#f3d6d0] transition hover:bg-[#381419]"
            >
              {t("manageAddresses")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-5 ">
        <section className="rounded-[1.4rem] border border-white/8 bg-[#120607] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2a1014] text-[#ffb1bd]">
                <HiIdentification className="text-xl" />
              </span>
              <div>
                <p className="text-2xl font-semibold text-white">{t("accountInformation")}</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#c9aba4]">{t("accountInfoDesc")}</p>
              </div>
            </div>
            <span className="rounded-full bg-[#301014] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff9eae]">
              {t("liveProfile")}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("fullName")}</span>
              <div className="flex h-12 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10]">
                <HiOutlineUser className="mr-3 shrink-0 text-lg text-[#d6a6a0]" />
                <input
                  {...accountRegister("full_name")}
                  placeholder={t("fullName")}
                  className="h-full w-full bg-transparent text-white outline-none placeholder:text-[#8f6d68]"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("email")}</span>
              <div className="flex h-12 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10]">
                <HiOutlineEnvelope className="mr-3 shrink-0 text-lg text-[#d6a6a0]" />
                <input
                  type="email"
                  {...accountRegister("email")}
                  placeholder={t("email")}
                  className="h-full w-full bg-transparent text-white outline-none placeholder:text-[#8f6d68]"
                />
              </div>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("phone")}</span>
              <div className="flex h-12 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10]">
                <HiOutlinePhone className="mr-3 shrink-0 text-lg text-[#d6a6a0]" />
                <input
                  {...accountRegister("phone")}
                  placeholder={t("phonePlaceholder")}
                  className="h-full w-full bg-transparent text-white outline-none placeholder:text-[#8f6d68]"
                />
              </div>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-white/8 pt-5">
            <button
              type="button"
              onClick={onAccountSave}
              className="inline-flex h-11 min-w-[152px] items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-5 font-semibold text-white transition hover:brightness-105"
            >
              {t("saveProfile")}
            </button>
            <button
              type="button"
              onClick={onResetAccountForm}
              className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-white/8 bg-[#2a0f12] px-5 font-semibold text-[#f3d6d0] transition hover:bg-[#381419]"
            >
              {t("reset")}
            </button>
          </div>
        </section>
      </div>

      <div className="mt-5">
        <section className="rounded-[1.4rem] border border-white/8 bg-[#120607] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a1014] text-[#ffb1bd]">
              <HiOutlineKey className="text-xl" />
            </span>
            <div>
              <p className="text-2xl font-semibold text-white">{t("security")}</p>
              <p className="mt-1 text-sm text-[#c9aba4]">{t("securityDesc")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("currentPassword")}</span>
              <div className="flex h-12 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10]">
                <HiOutlineShieldCheck className="mr-3 shrink-0 text-lg text-[#d6a6a0]" />
                <input
                  type="password"
                  {...passwordRegister("current_password")}
                  placeholder={t("currentPasswordPlaceholder")}
                  className="h-full w-full bg-transparent text-white outline-none placeholder:text-[#8f6d68]"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("newPassword")}</span>
              <div className="flex h-12 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10]">
                <HiOutlineKey className="mr-3 shrink-0 text-lg text-[#d6a6a0]" />
                <input
                  type="password"
                  {...passwordRegister("new_password")}
                  placeholder={t("newPasswordPlaceholder")}
                  className="h-full w-full bg-transparent text-white outline-none placeholder:text-[#8f6d68]"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#f1d5cb]">{t("confirmNewPassword")}</span>
              <div className="flex h-12 items-center rounded-2xl border border-white/8 bg-[#1c0a0d] px-4 transition focus-within:border-[#b54b58] focus-within:bg-[#210c10]">
                <HiOutlineKey className="mr-3 shrink-0 text-lg text-[#d6a6a0]" />
                <input
                  type="password"
                  {...passwordRegister("confirm_password")}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className="h-full w-full bg-transparent text-white outline-none placeholder:text-[#8f6d68]"
                />
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={onPasswordSave}
            className="mt-5 inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl bg-gradient-to-r from-[#8f1220] to-[#bb2435] px-5 font-semibold text-white transition hover:brightness-105"
          >
            {t("updatePassword")}
          </button>
        </section>
      </div>
    </div>
  );
}

export default SettingsTab;
