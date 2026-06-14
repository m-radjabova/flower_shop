import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineGift,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import registerBg from "../../assets/login_bg.png";
import { clearStoredAuth, getErrorMessage, getMe, persistTokens, registerUser } from "../../api/auth";
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

/* ─── Floating petal/pollen particles ─── */
const petals = [
  { left: "6%", top: "8%", size: 10, delay: 0, duration: 6.5, driftX: 20, driftY: -15 },
  { left: "88%", top: "5%", size: 13, delay: 1.4, duration: 8.2, driftX: -22, driftY: 12 },
  { left: "15%", top: "74%", size: 8, delay: 0.8, duration: 7.5, driftX: 16, driftY: -20 },
  { left: "78%", top: "80%", size: 11, delay: 2.3, duration: 9.5, driftX: -14, driftY: 18 },
  { left: "45%", top: "3%", size: 7, delay: 3.2, duration: 6.2, driftX: 24, driftY: -10 },
  { left: "94%", top: "48%", size: 9, delay: 2.0, duration: 8.0, driftX: -18, driftY: 14 },
  { left: "3%", top: "46%", size: 12, delay: 2.7, duration: 7.0, driftX: 22, driftY: -12 },
  { left: "35%", top: "90%", size: 6, delay: 0.5, duration: 7.4, driftX: -16, driftY: -18 },
  { left: "62%", top: "14%", size: 14, delay: 1.8, duration: 8.8, driftX: 18, driftY: 16 },
  { left: "12%", top: "92%", size: 5, delay: 3.8, duration: 6.6, driftX: -20, driftY: -14 },
  { left: "72%", top: "60%", size: 8, delay: 1.1, duration: 7.8, driftX: 14, driftY: 22 },
  { left: "50%", top: "42%", size: 10, delay: 3.0, duration: 9.0, driftX: -24, driftY: -8 },
];

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

  // Focus states
  const [focusedFields, setFocusedFields] = useState({
    full_name: false,
    email: false,
    phone_number: false,
    password: false,
    confirm_password: false,
  });

  // Password strength
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

  // Check password strength
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

  const onSubmit = async (values: RegisterFormValues) => {
    clearStoredAuth();
    await registerMutation.mutateAsync({
      ...values,
      phone_number: toApiPhone(values.phone_number),
      referral_code: values.referral_code?.trim() || undefined,
    });
  };

  const handleFocus = (field: keyof typeof focusedFields) => {
    setFocusedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof typeof focusedFields) => {
    setFocusedFields((prev) => ({ ...prev, [field]: false }));
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

  const passwordsMismatch = watchedConfirmPassword && watchedPassword !== watchedConfirmPassword;

  // Calculate form progress
  const formProgress = [
    watchedFullName.length > 0,
    watchedEmail.length > 0 && /@/.test(watchedEmail),
    watchedPhone.replace(/\s/g, "").length > 4,
    watchedPassword.length >= 6,
    watchedConfirmPassword.length >= 6 && watchedPassword === watchedConfirmPassword,
  ].filter(Boolean).length;

  const strengthSegments = [
    { label: "", filled: passwordStrength >= 1, color: "bg-red-400" },
    { label: "", filled: passwordStrength >= 2, color: "bg-orange-400" },
    { label: "", filled: passwordStrength >= 3, color: "bg-yellow-400" },
    { label: "", filled: passwordStrength >= 4, color: "bg-blue-400" },
    { label: "", filled: passwordStrength >= 5, color: "bg-green-400" },
  ];

  const inputBaseClass =
    "relative h-14 w-full rounded-xl border bg-white/[0.04] pl-12 pr-10 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#b99896] focus:border-[#ff6b7e]";

  // Reusable input wrapper
  const InputWrapper = ({
    field,
    icon: Icon,
    children,
    error,
  }: {
    field: keyof typeof focusedFields;
    icon: React.ElementType;
    children: React.ReactNode;
    error?: string;
  }) => {
    const isFocused = focusedFields[field];
    const hasValue =
      field === "full_name"
        ? !!watchedFullName
        : field === "email"
          ? !!watchedEmail
          : field === "phone_number"
            ? !!watchedPhone
            : field === "password"
              ? !!watchedPassword
              : field === "confirm_password"
                ? !!watchedConfirmPassword
                : false;

    return (
      <div
        className="group animate-fadeIn"
        style={{ animationFillMode: "backwards" } as React.CSSProperties}
      >
        <div className="relative">
          <div
            className={`relative rounded-xl transition-all duration-300 ${
              isFocused
                ? "shadow-[0_0_0_3px_rgba(255,107,126,0.08)]"
                : ""
            }`}
          >
            <div
              className={`relative rounded-xl transition-all duration-300 ${
                isFocused ? "bg-white/[0.06]" : ""
              }`}
            >
              <Icon
                className={`pointer-events-none absolute left-[14px] top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
                  isFocused
                    ? "text-[#ff6b7e]"
                    : "text-white/35 group-hover:text-white/50"
                }`}
              />

              {children}

              {hasValue && !error && (
                <HiOutlineCheckCircle className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-base text-green-400" />
              )}
            </div>
          </div>

          {error && (
            <div className="mt-1.5 overflow-hidden">
              <p className="flex animate-slideDown items-center gap-1.5 text-xs text-red-400/90">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                <span>{error}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

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
            className="font-semibold text-[#ff6b7e] transition-all duration-300 hover:text-[#ff8fa0] hover:underline decoration-1 underline-offset-2"
          >
            {t("auth.loginLink")}
          </Link>
        </>
      }
    >
      {/* ─── Floating Particles ─── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[2rem]">
        {petals.map((petal, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-[#ffb088]/40 via-[#ff8a7a]/30 to-[#ff6b7e]/20 shadow-lg"
            style={{
              left: petal.left,
              top: petal.top,
              width: petal.size,
              height: petal.size,
              animation: `registerFloat ${petal.duration}s ease-in-out ${petal.delay}s infinite`,
              willChange: "transform",
              "--drift-x": `${petal.driftX}px`,
              "--drift-y": `${petal.driftY}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ─── Brand signature ─── */}
      <div className="relative z-10 mb-1 text-center">
        <div className="relative mx-auto mb-2 flex h-[60px] w-[60px] items-center justify-center">
          <div className="absolute inset-0 animate-softPing rounded-full bg-[#ff6b7e]/20" />
          <div className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b7e]/20 to-[#ff8fa0]/5 ring-1 ring-[#ff6b7e]/15 backdrop-blur-sm">
            <svg viewBox="0 0 40 40" fill="none" className="h-[30px] w-[30px]" aria-hidden="true">
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

      {/* ─── Form Progress Bar ─── */}
      <div className="relative z-10 mb-4 animate-fadeIn">
        <div className="mb-1.5 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ease-out ${
                formProgress >= step
                  ? "bg-gradient-to-r from-[#ff6b7e] to-[#ff8fa0] shadow-[0_0_6px_rgba(255,107,126,0.3)]"
                  : "bg-white/[0.07]"
              } ${formProgress === step ? "animate-progressPulse" : ""}`}
            />
          ))}
        </div>
        <p className="text-center text-[10px] uppercase tracking-[0.15em] text-white/25">
          {formProgress === 5 ? (
            <span className="bg-gradient-to-r from-[#ff6b7e] to-[#ff8fa0] bg-clip-text text-transparent font-semibold">
              Ready to bloom! ✦
            </span>
          ) : (
            <span>
              <span className="text-white/40 font-medium">{formProgress}</span>
              <span className="text-white/20"> / 5 completed</span>
            </span>
          )}
        </p>
      </div>

      <form ref={formRef} className="relative z-10 space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-3.5 md:grid-cols-2">
          {/* Full Name Field */}
          <div style={{ animationDelay: "0.05s" }}>
            <InputWrapper
              field="full_name"
              icon={HiOutlineUser}
              error={errors.full_name?.message}
            >
              <input
                {...register("full_name")}
                placeholder={t("auth.fullNamePlaceholder")}
                onFocus={() => handleFocus("full_name")}
                onBlur={() => handleBlur("full_name")}
                className={`${inputBaseClass} ${
                  errors.full_name
                    ? "border-red-500/40 focus:border-red-500"
                    : focusedFields.full_name
                      ? "border-[#ff6b7e]/70 bg-white/[0.08]"
                      : "border-white/[0.08] hover:border-white/[0.18]"
                }`}
              />
            </InputWrapper>
          </div>

          {/* Email Field */}
          <div style={{ animationDelay: "0.1s" }}>
            <InputWrapper
              field="email"
              icon={HiOutlineEnvelope}
              error={errors.email?.message}
            >
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder={t("auth.emailPlaceholder")}
                onFocus={() => handleFocus("email")}
                onBlur={() => handleBlur("email")}
                className={`${inputBaseClass} ${
                  errors.email
                    ? "border-red-500/40 focus:border-red-500"
                    : focusedFields.email
                      ? "border-[#ff6b7e]/70 bg-white/[0.08]"
                      : "border-white/[0.08] hover:border-white/[0.18]"
                }`}
              />
            </InputWrapper>
          </div>

          {/* Phone Field */}
          <div style={{ animationDelay: "0.15s" }}>
            <InputWrapper
              field="phone_number"
              icon={HiOutlineDevicePhoneMobile}
              error={errors.phone_number?.message}
            >
              <input
                {...register("phone_number")}
                type="tel"
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
                onFocus={() => handleFocus("phone_number")}
                onBlur={() => handleBlur("phone_number")}
                className={`${inputBaseClass} ${
                  errors.phone_number
                    ? "border-red-500/40 focus:border-red-500"
                    : focusedFields.phone_number
                      ? "border-[#ff6b7e]/70 bg-white/[0.08]"
                      : "border-white/[0.08] hover:border-white/[0.18]"
                }`}
              />
            </InputWrapper>
          </div>

          {/* Referral Code Field */}
          <div style={{ animationDelay: "0.2s" }}>
            <div className="group animate-fadeIn" style={{ animationFillMode: "backwards" }}>
              <div className="relative">
                <div className="relative rounded-xl">
                  <div className="pointer-events-none absolute left-[14px] top-1/2 z-20 -translate-y-1/2">
                    <HiOutlineGift className="text-lg text-white/35 group-hover:text-white/50 transition-colors duration-300" />
                  </div>
                  <input
                    {...register("referral_code")}
                    placeholder={t("auth.referralCodePlaceholder")}
                    className="relative h-14 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-[15px] font-medium uppercase tracking-wider text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:normal-case placeholder:tracking-normal placeholder:text-[#b99896] hover:border-white/[0.18] focus:border-[#ff6b7e]/70 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,107,126,0.08)]"
                  />
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/30">
                <HiOutlineShieldCheck className="shrink-0" />
                <span>{t("auth.referralCodeHint")}</span>
              </div>
              {errors.referral_code && (
                <div className="mt-1.5 overflow-hidden">
                  <p className="flex animate-slideDown items-center gap-1.5 text-xs text-red-400/90">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                    <span>{errors.referral_code.message}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Password Field */}
        <div style={{ animationDelay: "0.25s" }}>
          <InputWrapper
            field="password"
            icon={HiOutlineLockClosed}
            error={errors.password?.message}
          >
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("auth.createStrongPassword")}
              onFocus={() => handleFocus("password")}
              onBlur={() => {
                handleBlur("password");
                checkPasswordStrength(watchedPassword || "");
              }}
              onChange={(e) => {
                register("password").onChange(e);
                checkPasswordStrength(e.target.value);
              }}
              className={`${inputBaseClass} pr-14 ${
                errors.password
                  ? "border-red-500/40 focus:border-red-500"
                  : focusedFields.password
                    ? "border-[#ff6b7e]/70 bg-white/[0.08]"
                    : "border-white/[0.08] hover:border-white/[0.18]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-[30px] w-[30px] items-center justify-center rounded-lg text-white/30 transition-all duration-300 hover:bg-white/[0.06] hover:text-[#ff6b7e] active:scale-90"
            >
              {showPassword ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
            </button>
          </InputWrapper>

          {/* Password Strength Indicator */}
          {watchedPassword && watchedPassword.length > 0 && (
            <div className="mt-1.5 animate-fadeIn">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-[3px]">
                  {strengthSegments.map((seg, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        seg.filled
                          ? `${seg.color} shadow-[0_0_4px_rgba(255,107,126,0.15)]`
                          : "bg-white/[0.06]"
                      }`}
                    />
                  ))}
                </div>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider transition-all duration-300 ${
                    passwordStrength <= 2
                      ? "text-red-400"
                      : passwordStrength <= 3
                        ? "text-yellow-400"
                        : passwordStrength <= 4
                          ? "text-blue-400"
                          : "text-green-400"
                  }`}
                >
                  {getStrengthText()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ animationDelay: "0.3s" }}>
          <InputWrapper
            field="confirm_password"
            icon={HiOutlineLockClosed}
            error={
              passwordsMismatch
                ? "Parollar mos emas"
                : errors.confirm_password?.message
            }
          >
            <input
              {...register("confirm_password")}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("auth.confirmPassword")}
              onFocus={() => handleFocus("confirm_password")}
              onBlur={() => handleBlur("confirm_password")}
              className={`${inputBaseClass} pr-14 ${
                passwordsMismatch
                  ? "border-red-500/40 focus:border-red-500"
                  : errors.confirm_password
                    ? "border-red-500/40 focus:border-red-500"
                    : focusedFields.confirm_password
                      ? "border-[#ff6b7e]/70 bg-white/[0.08]"
                      : "border-white/[0.08] hover:border-white/[0.18]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-[30px] w-[30px] items-center justify-center rounded-lg text-white/30 transition-all duration-300 hover:bg-white/[0.06] hover:text-[#ff6b7e] active:scale-90"
            >
              {showConfirmPassword ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
            </button>
          </InputWrapper>
        </div>

        <div
          className="animate-fadeIn pt-1"
          style={{ animationDelay: "0.35s", animationFillMode: "backwards" }}
        >
          <button
            type="submit"
            disabled={registerMutation.isPending || isSubmitting}
            className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#ff6b7e] to-[#ff8fa0] text-sm font-bold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_8px_30px_rgba(255,107,126,0.25)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b7e] via-[#ff8fa0] to-[#ff6b7e] bg-[length:200%_100%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-gradientShift" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.18] to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <span className="relative flex items-center gap-2.5">
              {registerMutation.isPending || isSubmitting ? (
                <>
                  <svg className="h-[18px] w-[18px] animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
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
                  <HiOutlineSparkles className="text-base transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span>{t("auth.signUpButton")}</span>
                </>
              )}
            </span>
          </button>
        </div>

        {/* Terms and Conditions */}
        <p className="pt-0.5 text-center text-[11px] leading-relaxed text-white/35">
          {t("auth.termsAgree")}{" "}
          <Link
            to="/terms"
            className="font-medium text-[#ff6b7e] transition-all duration-200 hover:text-[#ff8fa0] hover:underline decoration-1 underline-offset-2"
          >
            {t("auth.termsOfService")}
          </Link>{" "}
          {t("auth.and")}{" "}
          <Link
            to="/privacy"
            className="font-medium text-[#ff6b7e] transition-all duration-200 hover:text-[#ff8fa0] hover:underline decoration-1 underline-offset-2"
          >
            {t("auth.privacyPolicy")}
          </Link>
        </p>
      </form>

      {/* ─── Inject keyframes once ─── */}
      <style>{`
        @keyframes registerFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            opacity: 0.65;
          }
          50% {
            transform: translate3d(var(--drift-x), var(--drift-y), 0) scale(1.12);
            opacity: 0.85;
          }
          75% {
            opacity: 0.45;
          }
        }
        @keyframes spin-slow {
          to {
            --angle: 360deg;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes softPing {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        @keyframes progressPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </AuthShell>
  );
}

export default Register;
