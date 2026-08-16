import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  HiOutlineCheckCircle,
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineGift,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineUser,
} from "react-icons/hi2";
import { FaGoogle } from "react-icons/fa";
import { toast } from "react-toastify";
import registerBg from "../../assets/login_bg.png";
import { clearStoredAuth, getErrorMessage, getMe, googleAuthUser, persistTokens, registerUser } from "../../api/auth";
import { getFirebaseGoogleIdToken } from "../../api/googleAuth";
import AuthShell from "../../components/AuthShell";
import useContextPro from "../../hooks/useContextPro";
import { formatUzbekPhone, normalizeUzbekPhone, toApiPhone } from "../../utils/phone";
import { getPostLoginRoute } from "../../utils/roles";

const registerSchema = z
  .object({
    full_name: z.string().trim().min(3, "Full name kamida 3 ta belgi bo'lishi kerak"),
    email: z.string().trim().min(1, "Email kiriting").email("Email noto'g'ri formatda"),
    phone_number: z
      .string()
      .trim()
      .refine((value) => normalizeUzbekPhone(value).length === 9, {
        message: "Telefon raqamni to'liq kiriting",
      }),
    referral_code: z.string().trim().max(32, "Referral code juda uzun").optional().or(z.literal("")),
    password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
    confirm_password: z.string().min(6, "Confirm password kiriting"),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: "Parollar mos emas",
    path: ["confirm_password"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

type FieldName = "full_name" | "email" | "phone_number" | "password" | "confirm_password";

/* ─── Floating petal/pollen particles (pure Tailwind animations) ─── */
const petals = [
  { left: "6%", top: "8%", size: 10, animation: "animate-pulse [animation-duration:6.5s] [animation-delay:0s]" },
  { left: "88%", top: "5%", size: 13, animation: "animate-pulse [animation-duration:8.2s] [animation-delay:1.4s]" },
  { left: "15%", top: "74%", size: 8, animation: "animate-pulse [animation-duration:7.5s] [animation-delay:0.8s]" },
  { left: "78%", top: "80%", size: 11, animation: "animate-pulse [animation-duration:9.5s] [animation-delay:2.3s]" },
  { left: "45%", top: "3%", size: 7, animation: "animate-pulse [animation-duration:6.2s] [animation-delay:3.2s]" },
  { left: "94%", top: "48%", size: 9, animation: "animate-pulse [animation-duration:8s] [animation-delay:2s]" },
  { left: "3%", top: "46%", size: 12, animation: "animate-pulse [animation-duration:7s] [animation-delay:2.7s]" },
  { left: "35%", top: "90%", size: 6, animation: "animate-pulse [animation-duration:7.4s] [animation-delay:0.5s]" },
  { left: "62%", top: "14%", size: 14, animation: "animate-pulse [animation-duration:8.8s] [animation-delay:1.8s]" },
  { left: "12%", top: "92%", size: 5, animation: "animate-pulse [animation-duration:6.6s] [animation-delay:3.8s]" },
];

/**
 * NOTE: this component lives OUTSIDE `Register`.
 *
 * The previous version declared `InputWrapper` *inside* the `Register`
 * function body. That meant a brand-new component function was created on
 * every single render. React treats "a new function identity" as "a
 * different component type", so on every keystroke it unmounted the old
 * <input> DOM node and mounted a fresh one — the input (and its focus)
 * was destroyed and recreated after each character, which looked like
 * "can't type in the input". Declaring it here, once, fixes that.
 */
function InputField({
  id,
  label,
  icon: Icon,
  error,
  isFocused,
  hasValue,
  onFocus,
  onBlur,
  children,
  withEye = false,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  error?: string;
  isFocused: boolean;
  hasValue: boolean;
  onFocus: () => void;
  onBlur: () => void;
  children: (props: {
    id: string;
    onFocus: () => void;
    onBlur: () => void;
    className: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
  withEye?: boolean;
}) {
  const errorId = `${id}-error`;
  const inputClass = [
    "h-14 w-full rounded-2xl border bg-white/[0.05] pl-12 pr-11 text-[15px] font-medium text-[#fff7f6]",
    "caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#8a646d]",
    error
      ? "border-red-400/60 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
      : isFocused
        ? "border-[#ff7a8d] bg-white/[0.08]"
        : "border-white/[0.1] hover:border-white/[0.2]",
  ].join(" ");

  return (
    <div className="group">
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] font-bold uppercase leading-relaxed tracking-[0.16em] text-white/55 transition-colors duration-200 group-focus-within:text-[#ff8fa0]"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          className={`pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-lg transition-colors duration-200 ${
            error ? "text-red-400" : isFocused ? "text-[#ff6b7e]" : "text-white/40"
          }`}
        />
        {children({
          id,
          onFocus,
          onBlur,
          className: inputClass,
          "aria-invalid": !!error,
          "aria-describedby": error ? errorId : undefined,
        })}
        {hasValue && !error && !withEye && (
          <HiOutlineCheckCircle className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base text-emerald-400" />
        )}
      </div>
      {/* Reserve a fixed line of space so the error appearing/disappearing
          never pushes the rest of the form up or down. */}
      <div className="min-h-[18px] pt-1">
        {error && (
          <p id={errorId} role="alert" className="flex items-center gap-1 text-xs text-red-400">
            <HiOutlineExclamationCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    login,
    state: { user },
  } = useContextPro();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneValue, setPhoneValue] = useState("+998 ");
  const formRef = useRef<HTMLFormElement>(null);

  const [focusedField, setFocusedField] = useState<FieldName | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const referralCodeFromUrl = searchParams.get("ref")?.trim().toUpperCase() ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      full_name: "",
      email: "",
      phone_number: "+998 ",
      referral_code: referralCodeFromUrl,
      password: "",
      confirm_password: "",
    },
  });

  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirm_password");
  const watchedFullName = watch("full_name");
  const watchedEmail = watch("email");
  const watchedPhone = watch("phone_number");

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async (tokens) => {
      try {
        persistTokens(tokens);
        const me = await getMe();
        login(tokens, me);
        toast.success(t("auth.registerSuccess"));
        navigate(getPostLoginRoute(me), { replace: true });
      } catch (error) {
        clearStoredAuth();
        toast.error(getErrorMessage(error, t("auth.profileLoadError")));
      }
    },
    onError: (error) => {
      clearStoredAuth();
      toast.error(getErrorMessage(error, t("auth.registerError")));
    },
  });

  const googleMutation = useMutation({
    mutationFn: async () => {
      const idToken = await getFirebaseGoogleIdToken();
      const referralCode = watch("referral_code")?.trim();
      return googleAuthUser({
        id_token: idToken,
        referral_code: referralCode || undefined,
      });
    },
    onSuccess: async (tokens) => {
      try {
        persistTokens(tokens);
        const me = await getMe();
        login(tokens, me);
        toast.success(t("auth.googleSuccess"));
        navigate(getPostLoginRoute(me), { replace: true });
      } catch (error) {
        clearStoredAuth();
        toast.error(getErrorMessage(error, t("auth.profileLoadError")));
      }
    },
    onError: (error) => {
      clearStoredAuth();
      toast.error(getErrorMessage(error, t("auth.googleError")));
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    clearStoredAuth();
    await registerMutation.mutateAsync({
      ...values,
      phone_number: toApiPhone(values.phone_number),
      referral_code: values.referral_code?.trim() || undefined,
    });
  };

  if (user) {
    return <Navigate to={getPostLoginRoute(user)} replace />;
  }

  const getStrengthText = () => {
    if (passwordStrength <= 2) return t("auth.weak");
    if (passwordStrength <= 3) return t("auth.medium");
    if (passwordStrength <= 4) return t("auth.strong");
    return t("auth.veryStrong");
  };

  const passwordsMismatch = Boolean(watchedConfirmPassword) && watchedPassword !== watchedConfirmPassword;

  const formProgress = [
    watchedFullName.length > 0,
    watchedEmail.length > 0 && /@/.test(watchedEmail),
    watchedPhone.replace(/\s/g, "").length > 4,
    watchedPassword.length >= 6,
    watchedConfirmPassword.length >= 6 && watchedPassword === watchedConfirmPassword,
  ].filter(Boolean).length;

  const strengthColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-400", "bg-emerald-400"];
  const strengthTextColors = ["text-red-400", "text-orange-400", "text-yellow-400", "text-blue-400", "text-emerald-400"];

  const isBusy = registerMutation.isPending || googleMutation.isPending || isSubmitting;

  return (
    <AuthShell
      title={t("auth.createAccount")}
      subtitle={t("auth.registerSubtitle")}
      backgroundImage={registerBg}
      backgroundAsCss
      panelPosition="left"
      panelClassName="max-w-[760px] lg:max-w-[860px] lg:translate-x-10"
      footer={
        <>
          {t("auth.alreadyHaveAccount")}{" "}
          <Link
            to="/login"
            className="font-semibold text-[#ff6b7e] underline-offset-2 transition-colors duration-200 hover:text-[#ff8fa0] hover:underline"
          >
            {t("auth.loginLink")}
          </Link>
        </>
      }
    >
      {/* ─── Floating particles (decorative only) ─── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[2rem] motion-reduce:hidden">
        {petals.map((petal, i) => (
          <span
            key={i}
            className={`absolute rounded-full bg-gradient-to-br from-[#ffb088]/40 via-[#ff8a7a]/30 to-[#ff6b7e]/20 ${petal.animation}`}
            style={{
              left: petal.left,
              top: petal.top,
              width: petal.size,
              height: petal.size,
            }}
          />
        ))}
      </div>

      {/* ─── Brand mark ─── */}
      <div className="relative z-10 mb-2 text-center">
        <div className="relative mx-auto mb-2 flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#ff6b7e]/20 [animation-duration:2.4s] motion-reduce:hidden" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b7e]/20 to-[#ff8fa0]/5 ring-1 ring-[#ff6b7e]/15 backdrop-blur-sm">
            <svg viewBox="0 0 40 40" fill="none" className="h-7 w-7" aria-hidden="true">
              <circle cx="20" cy="20" r="18" stroke="url(#flower-grad)" strokeWidth="1.2" />
              <path
                d="M20 8C16 13 12 16 12 20C12 24.4 16.8 29.6 20 32C23.2 29.6 28 24.4 28 20C28 16 24 13 20 8Z"
                fill="url(#flower-grad)"
                opacity="0.6"
              />
              <circle cx="20" cy="20" r="4" fill="url(#flower-grad)" />
              <defs>
                <linearGradient id="flower-grad" x1="8" y1="8" x2="32" y2="32">
                  <stop stopColor="#ff6b7e" />
                  <stop offset="1" stopColor="#ff8fa0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* ─── Progress ─── */}
      <div className="relative z-10 mb-5" aria-hidden="true">
        <div className="mb-1.5 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ease-out ${
                formProgress >= step ? "bg-gradient-to-r from-[#ff6b7e] to-[#ff8fa0]" : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-[10px] uppercase tracking-[0.15em] text-white/30">
          {formProgress === 5 ? (
            <span className="bg-gradient-to-r from-[#ff6b7e] to-[#ff8fa0] bg-clip-text font-semibold text-transparent">
              {t("auth.readyToSubmit", "Barcha maydonlar to'ldirildi")}
            </span>
          ) : (
            <span>
              <span className="font-medium text-white/45">{formProgress}</span>
              <span className="text-white/25"> / 5</span>
            </span>
          )}
        </p>
      </div>

      <form ref={formRef} className="relative z-10 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            clearStoredAuth();
            googleMutation.mutate();
          }}
          className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-[#fff7f6] transition-all duration-300 hover:border-white/25 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaGoogle className="text-base text-[#ff8fa0]" />
          <span>{googleMutation.isPending ? t("auth.googleLoading") : t("auth.continueWithGoogle")}</span>
        </button>

        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-white/25">
          <span className="h-px flex-1 bg-white/[0.08]" />
          <span>{t("auth.or")}</span>
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            id="full_name"
            label={t("auth.fullNamePlaceholder")}
            icon={HiOutlineUser}
            error={errors.full_name?.message}
            isFocused={focusedField === "full_name"}
            hasValue={!!watchedFullName}
            onFocus={() => setFocusedField("full_name")}
            onBlur={() => setFocusedField(null)}
          >
            {(inputProps) => (
              <input
                {...register("full_name")}
                {...inputProps}
                placeholder={t("auth.fullNamePlaceholder")}
              />
            )}
          </InputField>

          <InputField
            id="email"
            label={t("auth.emailPlaceholder")}
            icon={HiOutlineEnvelope}
            error={errors.email?.message}
            isFocused={focusedField === "email"}
            hasValue={!!watchedEmail}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          >
            {(inputProps) => (
              <input
                {...register("email")}
                {...inputProps}
                type="email"
                autoComplete="email"
                placeholder={t("auth.emailPlaceholder")}
              />
            )}
          </InputField>

          <InputField
            id="phone_number"
            label={t("auth.phonePlaceholder")}
            icon={HiOutlineDevicePhoneMobile}
            error={errors.phone_number?.message}
            isFocused={focusedField === "phone_number"}
            hasValue={!!watchedPhone}
            onFocus={() => setFocusedField("phone_number")}
            onBlur={() => setFocusedField(null)}
          >
            {(inputProps) => (
              <input
                {...register("phone_number")}
                {...inputProps}
                type="tel"
                inputMode="numeric"
                value={phoneValue}
                onChange={(event) => {
                  const formatted = formatUzbekPhone(event.target.value);
                  setPhoneValue(formatted);
                  setValue("phone_number", formatted, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                placeholder={t("auth.phonePlaceholder")}
              />
            )}
          </InputField>

          <div className="group">
            <label
              htmlFor="referral_code"
              className="mb-2 block text-[11px] font-bold uppercase leading-relaxed tracking-[0.16em] text-white/55 transition-colors duration-200 group-focus-within:text-[#ff8fa0]"
            >
              {t("auth.referralCode")}
            </label>
            <div className="relative">
              <HiOutlineGift className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-lg text-white/40 transition-colors duration-200 group-focus-within:text-[#ff6b7e]" />
              <input
                id="referral_code"
                {...register("referral_code")}
                placeholder={t("auth.referralCodePlaceholder")}
                aria-invalid={!!errors.referral_code}
                className="h-14 w-full rounded-2xl border border-white/[0.1] bg-white/[0.05] pl-12 pr-4 text-[15px] font-medium uppercase tracking-wider text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:normal-case placeholder:tracking-normal placeholder:text-[#8a646d] hover:border-white/[0.2] focus:border-[#ff7a8d] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#ff6b7e]/10"
              />
            </div>
            <div className="min-h-[18px] pt-1">
              {errors.referral_code ? (
                <p role="alert" className="flex items-center gap-1 text-xs text-red-400">
                  <HiOutlineExclamationCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.referral_code.message}</span>
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-white/30">
                  <HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>{t("auth.referralCodeHint")}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <InputField
            id="password"
            label={t("auth.createStrongPassword")}
            icon={HiOutlineLockClosed}
            error={errors.password?.message}
            isFocused={focusedField === "password"}
            hasValue={!!watchedPassword}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            withEye
          >
            {(inputProps) => (
              <div className="relative">
                <input
                  {...register("password")}
                  {...inputProps}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("auth.createStrongPassword")}
                  className={`${inputProps.className} pr-14`}
                  onChange={(e) => {
                    register("password").onChange(e);
                    checkPasswordStrength(e.target.value);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? t("auth.hidePassword", "Parolni yashirish") : t("auth.showPassword", "Parolni ko'rsatish")}
                  className="!absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/35 transition-colors duration-200 hover:bg-white/[0.08] hover:text-[#ff6b7e]"
                >
                  {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                </button>
              </div>
            )}
          </InputField>

          {watchedPassword.length > 0 && (
            <div className="-mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {strengthColors.map((color, i) => (
                  <div
                    key={color}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      passwordStrength >= i + 1 ? color : "bg-white/[0.08]"
                    }`}
                  />
                ))}
              </div>
              <span className={`shrink-0 text-[10px] font-medium uppercase tracking-wider ${strengthTextColors[Math.min(passwordStrength, 5) - 1] ?? "text-white/30"}`}>
                {getStrengthText()}
              </span>
            </div>
          )}
        </div>

        <InputField
          id="confirm_password"
          label={t("auth.confirmPassword")}
          icon={HiOutlineLockClosed}
          error={passwordsMismatch ? "Parollar mos emas" : errors.confirm_password?.message}
          isFocused={focusedField === "confirm_password"}
          hasValue={!!watchedConfirmPassword}
          onFocus={() => setFocusedField("confirm_password")}
          onBlur={() => setFocusedField(null)}
          withEye
        >
          {(inputProps) => (
            <div className="relative">
              <input
                {...register("confirm_password")}
                {...inputProps}
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("auth.confirmPassword")}
                className={`${inputProps.className} pr-14`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={
                  showConfirmPassword ? t("auth.hidePassword", "Parolni yashirish") : t("auth.showPassword", "Parolni ko'rsatish")
                }
                className="!absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/35 transition-colors duration-200 hover:bg-white/[0.08] hover:text-[#ff6b7e]"
              >
                {showConfirmPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
          )}
        </InputField>

        <div className="pt-1">
          <button
            type="submit"
            disabled={isBusy}
            className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6b7e] to-[#ff8fa0] text-sm font-bold uppercase tracking-[0.15em] text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.18] to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            <span className="relative flex items-center gap-2.5">
              {registerMutation.isPending || isSubmitting ? (
                <>
                  <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{t("auth.creatingAccount")}</span>
                </>
              ) : (
                <>
                  <HiOutlineSparkles className="text-base transition-transform duration-200 group-hover:rotate-12" />
                  <span>{t("auth.signUpButton")}</span>
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

export default Register;