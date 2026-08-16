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
import { FaGoogle } from "react-icons/fa";
import { toast } from "react-toastify";
import loginBg from "../../assets/login_bg.png";
import { clearStoredAuth, getErrorMessage, getMe, googleAuthUser, loginUser, persistTokens } from "../../api/auth";
import { getFirebaseGoogleIdToken } from "../../api/googleAuth";
import AuthShell from "../../components/AuthShell";
import useContextPro from "../../hooks/useContextPro";
import { getPostLoginRoute } from "../../utils/roles";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email kiriting").email("Email noto'g'ri formatda"),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/* ─── Floating petal/pollen particles (pure Tailwind animations) ─── */
const petals = [
  { left: "8%", top: "10%", size: 10, animation: "animate-pulse [animation-duration:6s] [animation-delay:0s]" },
  { left: "85%", top: "6%", size: 14, animation: "animate-pulse [animation-duration:8s] [animation-delay:1.2s]" },
  { left: "20%", top: "70%", size: 8, animation: "animate-pulse [animation-duration:7.2s] [animation-delay:0.6s]" },
  { left: "75%", top: "76%", size: 12, animation: "animate-pulse [animation-duration:9s] [animation-delay:2.1s]" },
  { left: "50%", top: "4%", size: 6, animation: "animate-pulse [animation-duration:5.8s] [animation-delay:3s]" },
  { left: "92%", top: "44%", size: 9, animation: "animate-pulse [animation-duration:7.8s] [animation-delay:1.8s]" },
  { left: "4%", top: "44%", size: 11, animation: "animate-pulse [animation-duration:6.6s] [animation-delay:2.5s]" },
  { left: "38%", top: "88%", size: 7, animation: "animate-pulse [animation-duration:7s] [animation-delay:0.3s]" },
  { left: "60%", top: "12%", size: 13, animation: "animate-pulse [animation-duration:8.4s] [animation-delay:1.5s]" },
  { left: "15%", top: "90%", size: 5, animation: "animate-pulse [animation-duration:6.2s] [animation-delay:3.5s]" },
  { left: "70%", top: "58%", size: 8, animation: "animate-pulse [animation-duration:7.5s] [animation-delay:0.9s]" },
  { left: "44%", top: "40%", size: 10, animation: "animate-pulse [animation-duration:8.8s] [animation-delay:2.8s]" },
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

  const googleMutation = useMutation({
    mutationFn: async () => {
      const idToken = await getFirebaseGoogleIdToken();
      return googleAuthUser({ id_token: idToken });
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
            className={`absolute rounded-full bg-gradient-to-br from-[#ffb088]/40 via-[#ff8a7a]/30 to-[#ff6b7e]/20 shadow-lg ${petal.animation}`}
            style={{
              left: petal.left,
              top: petal.top,
              width: petal.size,
              height: petal.size,
            }}
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
        <button
          type="button"
          disabled={googleMutation.isPending || loginMutation.isPending || isSubmitting}
          onClick={() => {
            clearStoredAuth();
            googleMutation.mutate();
          }}
          className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-[#fff7f6] transition-all duration-300 hover:border-white/25 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaGoogle className="text-base text-[#ff8fa0]" />
          <span>{googleMutation.isPending ? t("auth.googleLoading") : t("auth.continueWithGoogle")}</span>
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-white/28">
          <span className="h-px flex-1 bg-white/10" />
          <span>{t("auth.or")}</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* Email Field */}
        <div className="group">
          <label
            htmlFor="email"
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 transition-colors duration-200 group-focus-within:text-[#ff8fa0]"
          >
            {t("auth.emailAddress")}
          </label>
          <div className="relative">
            <HiOutlineEnvelope
              className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
                isFocusedEmail || errors.email ? "text-[#ff6b7e] scale-110" : "text-white/40"
              }`}
            />
            <input
              id="email"
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              onFocus={() => setIsFocusedEmail(true)}
              onBlur={() => setIsFocusedEmail(false)}
              className={`relative h-14 w-full rounded-2xl border bg-white/[0.06] pl-12 pr-12 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#8a646d] focus:border-[#ff6b7e] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#ff6b7e]/10 ${
                errors.email
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                  : isFocusedEmail
                    ? "border-[#ff6b7e]"
                    : "border-white/10 hover:border-white/20"
              }`}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="group">
          <label
            htmlFor="password"
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 transition-colors duration-200 group-focus-within:text-[#ff8fa0]"
          >
            {t("auth.password")}
          </label>
          <div className="relative">
            <HiOutlineLockClosed
              className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
                isFocusedPassword || errors.password ? "text-[#ff6b7e] scale-110" : "text-white/40"
              }`}
            />
            <input
              id="password"
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("auth.passwordPlaceholder")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              onFocus={() => setIsFocusedPassword(true)}
              onBlur={() => setIsFocusedPassword(false)}
              className={`relative h-14 w-full rounded-2xl border bg-white/[0.06] pl-12 pr-14 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#8a646d] focus:border-[#ff6b7e] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#ff6b7e]/10 ${
                errors.password
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10"
                  : isFocusedPassword
                    ? "border-[#ff6b7e]"
                    : "border-white/10 hover:border-white/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? t("auth.hidePassword", "Parolni yashirish") : t("auth.showPassword", "Parolni ko'rsatish")}
              className="!absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition-all duration-200 hover:bg-white/[0.07] hover:text-[#ff6b7e]"
            >
              {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
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
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loginMutation.isPending || googleMutation.isPending || isSubmitting}
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
    </AuthShell>
  );
}

export default Login;
