import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { HiOutlineEnvelope, HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed, HiOutlineSparkles } from "react-icons/hi2";
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

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  
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
      footer={
        <>
          {t("auth.dontHaveAccount")}{" "}
          <Link
            to="/register"
            className="font-semibold text-[#ff6b7e] transition hover:text-[#ff8fa0]"
          >
            {t("auth.signUp")}
          </Link>
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <div className="group">
          <label className="mb-2 block text-sm font-medium text-[#f5dfdd] transition-all duration-300 group-focus-within:text-[#ff6b7e]">
            {t("auth.emailAddress")}
          </label>
          <div className={`relative rounded-2xl transition-all duration-300 ${
            isFocusedEmail ? "shadow-[0_0_0_4px_rgba(255,107,126,0.1)]" : ""
          }`}>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b7e]/20 to-[#ff8fa0]/20 opacity-0 transition-opacity duration-300 ${
              isFocusedEmail ? "opacity-100" : ""
            }`}></div>
            <HiOutlineEnvelope className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
              isFocusedEmail ? "text-[#ff6b7e] scale-110" : "text-white/40"
            }`} />
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
            <p className="mt-2 flex items-center gap-1 text-xs text-red-400 animate-fadeIn">
              <span className="inline-block h-1 w-1 rounded-full bg-red-400"></span>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="group">
          <label className="mb-2 block text-sm font-medium text-[#f5dfdd] transition-all duration-300 group-focus-within:text-[#ff6b7e]">
            {t("auth.password")}
          </label>
          <div className={`relative rounded-2xl transition-all duration-300 ${
            isFocusedPassword ? "shadow-[0_0_0_4px_rgba(255,107,126,0.1)]" : ""
          }`}>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b7e]/20 to-[#ff8fa0]/20 opacity-0 transition-opacity duration-300 ${
              isFocusedPassword ? "opacity-100" : ""
            }`}></div>
            <HiOutlineLockClosed className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
              isFocusedPassword ? "text-[#ff6b7e] scale-110" : "text-white/40"
            }`} />
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
            <p className="mt-2 flex items-center gap-1 text-xs text-red-400 animate-fadeIn">
              <span className="inline-block h-1 w-1 rounded-full bg-red-400"></span>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loginMutation.isPending || isSubmitting}
          className="group relative mt-2 inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6b7e] to-[#ff8fa0] text-sm font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#ff6b7e]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
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