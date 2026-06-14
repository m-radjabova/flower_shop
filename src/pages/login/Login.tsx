import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineLockClosed,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import loginBg from "../../assets/login_bg.png";
import { clearStoredAuth, getErrorMessage, getMe, loginUser, persistTokens } from "../../api/auth";
import AuthShell from "../../components/AuthShell";
import useContextPro from "../../hooks/useContextPro";
import { getPostLoginRoute } from "../../utils/roles";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email kiriting").email("Email noto'g'ri formatda"),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/* ─── Floating petal/pollen particles ─── */
const petals = [
  { left: "8%", top: "10%", size: 10, delay: 0, duration: 6, driftX: 18, driftY: -14 },
  { left: "85%", top: "6%", size: 14, delay: 1.2, duration: 8, driftX: -20, driftY: 10 },
  { left: "20%", top: "70%", size: 8, delay: 0.6, duration: 7.2, driftX: 14, driftY: -18 },
  { left: "75%", top: "76%", size: 12, delay: 2.1, duration: 9, driftX: -12, driftY: 16 },
  { left: "50%", top: "4%", size: 6, delay: 3.0, duration: 5.8, driftX: 22, driftY: -8 },
  { left: "92%", top: "44%", size: 9, delay: 1.8, duration: 7.8, driftX: -16, driftY: 12 },
  { left: "4%", top: "44%", size: 11, delay: 2.5, duration: 6.6, driftX: 20, driftY: -10 },
  { left: "38%", top: "88%", size: 7, delay: 0.3, duration: 7, driftX: -14, driftY: -16 },
  { left: "60%", top: "12%", size: 13, delay: 1.5, duration: 8.4, driftX: 16, driftY: 14 },
  { left: "15%", top: "90%", size: 5, delay: 3.5, duration: 6.2, driftX: -18, driftY: -12 },
  { left: "70%", top: "58%", size: 8, delay: 0.9, duration: 7.5, driftX: 12, driftY: 20 },
  { left: "44%", top: "40%", size: 10, delay: 2.8, duration: 8.8, driftX: -22, driftY: -6 },
];

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    login,
    state: { user },
  } = useContextPro();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (tokens) => {
      try {
        persistTokens(tokens);
        const me = await getMe();
        login(tokens, me);
        toast.success(t("auth.loginSuccess"));
        navigate(getPostLoginRoute(me), { replace: true });
      } catch (error) {
        clearStoredAuth();
        toast.error(getErrorMessage(error, t("auth.profileLoadError")));
      }
    },
    onError: (error) => {
      clearStoredAuth();
      toast.error(getErrorMessage(error, t("auth.loginError")));
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    clearStoredAuth();
    await loginMutation.mutateAsync(values);
  };

  if (user) {
    return <Navigate to={getPostLoginRoute(user)} replace />;
  }

  return (
    <AuthShell
      title={t("auth.welcomeBack")}
      subtitle={t("auth.loginSubtitle")}
      backgroundImage={loginBg}
      backgroundAsCss
      footer={
        <>
          {t("auth.dontHaveAccount")}{" "}
          <Link
            to="/register"
            className="font-semibold text-[#ff6b7e] transition hover:text-[#ff8fa0] hover:underline decoration-1 underline-offset-2"
          >
            {t("auth.signUp")}
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
              animation: `loginFloat ${petal.duration}s ease-in-out ${petal.delay}s infinite`,
              willChange: "transform",
              "--drift-x": `${petal.driftX}px`,
              "--drift-y": `${petal.driftY}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ─── Brand signature ─── */}
      <div className="relative z-10 mb-2 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b7e]/25 to-[#ff8fa0]/10 ring-1 ring-[#ff6b7e]/20 backdrop-blur-sm">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            className="h-8 w-8"
            aria-hidden="true"
          >
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
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <span className="inline-flex h-16 w-16 animate-ping rounded-full bg-[#ff6b7e]/15" />
        </div>
      </div>

      <form className="relative z-10 mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <div className="group">
          <label className="mb-2 block text-sm font-medium text-[#f5dfdd] transition-all duration-300 group-focus-within:text-[#ff6b7e]">
            {t("auth.emailAddress")}
          </label>
          <div
            className={`relative rounded-2xl transition-all duration-300 ${
              isFocusedEmail ? "shadow-[0_0_0_4px_rgba(255,107,126,0.1)]" : ""
            }`}
          >
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b7e]/20 to-[#ff8fa0]/20 opacity-0 transition-opacity duration-300 ${
                isFocusedEmail ? "opacity-100" : ""
              }`}
            />
            <HiOutlineEnvelope
              className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
                isFocusedEmail ? "text-[#ff6b7e] scale-110" : "text-white/40"
              }`}
            />
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              onFocus={() => setIsFocusedEmail(true)}
              onBlur={() => setIsFocusedEmail(false)}
              className={`relative h-14 w-full rounded-2xl border bg-white/8 pl-12 pr-4 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#b99896] focus:border-[#ff6b7e] ${
                errors.email
                  ? "border-red-500/50 focus:border-red-500"
                  : isFocusedEmail
                    ? "border-[#ff6b7e] bg-white/12"
                    : "border-white/10 hover:border-white/20"
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400 animate-fadeIn">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="group">
          <label className="mb-2 block text-sm font-medium text-[#f5dfdd] transition-all duration-300 group-focus-within:text-[#ff6b7e]">
            {t("auth.password")}
          </label>
          <div
            className={`relative rounded-2xl transition-all duration-300 ${
              isFocusedPassword ? "shadow-[0_0_0_4px_rgba(255,107,126,0.1)]" : ""
            }`}
          >
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b7e]/20 to-[#ff8fa0]/20 opacity-0 transition-opacity duration-300 ${
                isFocusedPassword ? "opacity-100" : ""
              }`}
            />
            <HiOutlineLockClosed
              className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
                isFocusedPassword ? "text-[#ff6b7e] scale-110" : "text-white/40"
              }`}
            />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("auth.passwordPlaceholder")}
              onFocus={() => setIsFocusedPassword(true)}
              onBlur={() => setIsFocusedPassword(false)}
              className={`relative h-14 w-full rounded-2xl border bg-white/8 pl-12 pr-14 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#b99896] focus:border-[#ff6b7e] ${
                errors.password
                  ? "border-red-500/50 focus:border-red-500"
                  : isFocusedPassword
                    ? "border-[#ff6b7e] bg-white/12"
                    : "border-white/10 hover:border-white/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-all duration-300 hover:text-[#ff6b7e] hover:scale-110"
            >
              {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400 animate-fadeIn">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              <span>{errors.password.message}</span>
            </p>
          )}

          {/* Forgot password & remember me */}
          <div className="mt-3 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer sr-only"
              />
              <span
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border transition-all duration-200 ${
                  rememberMe
                    ? "border-[#ff6b7e] bg-gradient-to-br from-[#ff6b7e] to-[#ff8fa0]"
                    : "border-white/20 bg-white/5 hover:border-white/35"
                }`}
              >
                {rememberMe && (
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5 text-white">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  </svg>
                )}
              </span>
              <span className="text-xs text-[#d8b1ae] transition-colors hover:text-[#ff6b7e]">
                Remember me
              </span>
            </label>
            <button
              type="button"
              className="text-xs text-[#d8b1ae] underline decoration-1 underline-offset-2 decoration-white/20 transition-all hover:text-[#ff6b7e] hover:decoration-[#ff6b7e]/40"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loginMutation.isPending || isSubmitting}
          className="group relative mt-2 inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6b7e] to-[#ff8fa0] text-sm font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#ff6b7e]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {/* Shimmer line */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />

          {/* Radial glow */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
          </div>

          <span className="relative flex items-center gap-2">
            {loginMutation.isPending || isSubmitting ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t("auth.loading")}</span>
              </>
            ) : (
              <>
                <HiOutlineSparkles className="text-base" />
                <span>{t("auth.loginButton")}</span>
              </>
            )}
          </span>
        </button>
      </form>

      {/* ─── Inject floating keyframes once ─── */}
      <style>{`
        @keyframes loginFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            opacity: 0.7;
          }
          50% {
            transform: translate3d(var(--drift-x), var(--drift-y), 0) scale(1.15);
            opacity: 0.9;
          }
          75% {
            opacity: 0.5;
          }
        }
      `}</style>
    </AuthShell>
  );
}

export default Login;
