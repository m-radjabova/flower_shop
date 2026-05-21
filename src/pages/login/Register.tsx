import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import registerBg from "../../assets/register_bg.png";
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
    password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
    confirm_password: z.string().min(6, "Confirm password kiriting"),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: "Parollar mos emas",
    path: ["confirm_password"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function Register() {
  const navigate = useNavigate();
  const {
    login,
    state: { user },
  } = useContextPro();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneValue, setPhoneValue] = useState("+998 ");
  
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
      password: "",
      confirm_password: "",
    },
  });

  const watchedPassword = watch("password");
  
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
        toast.success("Account yaratildi");
        navigate(getPostLoginRoute(me), { replace: true });
      } catch (error) {
        clearStoredAuth();
        toast.error(getErrorMessage(error, "Profilni yuklashda xatolik yuz berdi"));
      }
    },
    onError: (error) => {
      clearStoredAuth();
      toast.error(getErrorMessage(error, "Register qilishda xatolik yuz berdi"));
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    clearStoredAuth();
    await registerMutation.mutateAsync({
      ...values,
      phone_number: toApiPhone(values.phone_number),
    });
  };

  const handleFocus = (field: keyof typeof focusedFields) => {
    setFocusedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof typeof focusedFields) => {
    setFocusedFields(prev => ({ ...prev, [field]: false }));
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    if (passwordStrength <= 4) return "Strong";
    return "Very Strong";
  };

  return (
    <AuthShell
      title="Create Account"
      subtitle="Sign up to get started"
      backgroundImage={registerBg}
      panelPosition="left"
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#ff6b7e] transition hover:text-[#ff8fa0]"
          >
            Login
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Full Name Field */}
        <div className="group">
          <label className="mb-2 block text-sm font-medium text-[#f5dfdd] transition-all duration-300 group-focus-within:text-[#ff6b7e]">
            Full Name
          </label>
          <div className={`relative rounded-2xl transition-all duration-300 ${
            focusedFields.full_name ? "shadow-[0_0_0_4px_rgba(255,107,126,0.1)]" : ""
          }`}>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b7e]/20 to-[#ff8fa0]/20 opacity-0 transition-opacity duration-300 ${
              focusedFields.full_name ? "opacity-100" : ""
            }`}></div>
            <HiOutlineUser className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
              focusedFields.full_name ? "text-[#ff6b7e] scale-110" : "text-white/40"
            }`} />
            <input
              {...register("full_name")}
              placeholder="John Doe"
              onFocus={() => handleFocus("full_name")}
              onBlur={() => handleBlur("full_name")}
              className={`relative h-14 w-full rounded-2xl border bg-white/8 pl-12 pr-4 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#b99896] focus:border-[#ff6b7e] ${
                errors.full_name 
                  ? "border-red-500/50 focus:border-red-500" 
                  : focusedFields.full_name 
                    ? "border-[#ff6b7e] bg-white/12" 
                    : "border-white/10 hover:border-white/20"
              }`}
            />
          </div>
          {errors.full_name && (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-400 animate-fadeIn">
              <span className="inline-block h-1 w-1 rounded-full bg-red-400"></span>
              {errors.full_name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="group">
          <label className="mb-2 block text-sm font-medium text-[#f5dfdd] transition-all duration-300 group-focus-within:text-[#ff6b7e]">
            Email address
          </label>
          <div className={`relative rounded-2xl transition-all duration-300 ${
            focusedFields.email ? "shadow-[0_0_0_4px_rgba(255,107,126,0.1)]" : ""
          }`}>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b7e]/20 to-[#ff8fa0]/20 opacity-0 transition-opacity duration-300 ${
              focusedFields.email ? "opacity-100" : ""
            }`}></div>
            <HiOutlineEnvelope className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
              focusedFields.email ? "text-[#ff6b7e] scale-110" : "text-white/40"
            }`} />
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="hello@example.com"
              onFocus={() => handleFocus("email")}
              onBlur={() => handleBlur("email")}
              className={`relative h-14 w-full rounded-2xl border bg-white/8 pl-12 pr-4 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#b99896] focus:border-[#ff6b7e] ${
                errors.email 
                  ? "border-red-500/50 focus:border-red-500" 
                  : focusedFields.email 
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

        {/* Phone Field */}
        <div className="group">
          <label className="mb-2 block text-sm font-medium text-[#f5dfdd] transition-all duration-300 group-focus-within:text-[#ff6b7e]">
            Phone number
          </label>
          <div className={`relative rounded-2xl transition-all duration-300 ${
            focusedFields.phone_number ? "shadow-[0_0_0_4px_rgba(255,107,126,0.1)]" : ""
          }`}>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b7e]/20 to-[#ff8fa0]/20 opacity-0 transition-opacity duration-300 ${
              focusedFields.phone_number ? "opacity-100" : ""
            }`}></div>
            <HiOutlineDevicePhoneMobile className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
              focusedFields.phone_number ? "text-[#ff6b7e] scale-110" : "text-white/40"
            }`} />
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
              placeholder="+998 99 123 45 67"
              onFocus={() => handleFocus("phone_number")}
              onBlur={() => handleBlur("phone_number")}
              className={`relative h-14 w-full rounded-2xl border bg-white/8 pl-12 pr-4 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#b99896] focus:border-[#ff6b7e] ${
                errors.phone_number 
                  ? "border-red-500/50 focus:border-red-500" 
                  : focusedFields.phone_number 
                    ? "border-[#ff6b7e] bg-white/12" 
                    : "border-white/10 hover:border-white/20"
              }`}
            />
          </div>
          {errors.phone_number && (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-400 animate-fadeIn">
              <span className="inline-block h-1 w-1 rounded-full bg-red-400"></span>
              {errors.phone_number.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="group">
          <label className="mb-2 block text-sm font-medium text-[#f5dfdd] transition-all duration-300 group-focus-within:text-[#ff6b7e]">
            Password
          </label>
          <div className={`relative rounded-2xl transition-all duration-300 ${
            focusedFields.password ? "shadow-[0_0_0_4px_rgba(255,107,126,0.1)]" : ""
          }`}>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b7e]/20 to-[#ff8fa0]/20 opacity-0 transition-opacity duration-300 ${
              focusedFields.password ? "opacity-100" : ""
            }`}></div>
            <HiOutlineLockClosed className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
              focusedFields.password ? "text-[#ff6b7e] scale-110" : "text-white/40"
            }`} />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              onFocus={() => handleFocus("password")}
              onBlur={() => {
                handleBlur("password");
                checkPasswordStrength(watchedPassword || "");
              }}
              onChange={(e) => {
                register("password").onChange(e);
                checkPasswordStrength(e.target.value);
              }}
              className={`relative h-14 w-full rounded-2xl border bg-white/8 pl-12 pr-14 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#b99896] focus:border-[#ff6b7e] ${
                errors.password 
                  ? "border-red-500/50 focus:border-red-500" 
                  : focusedFields.password 
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
          
          {/* Password Strength Indicator */}
          {watchedPassword && watchedPassword.length > 0 && (
            <div className="mt-2 animate-fadeIn">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getStrengthColor()} transition-all duration-300 rounded-full`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-white/55">{getStrengthText()}</span>
              </div>
            </div>
          )}
          
          {errors.password && (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-400 animate-fadeIn">
              <span className="inline-block h-1 w-1 rounded-full bg-red-400"></span>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="group">
          <label className="mb-2 block text-sm font-medium text-[#f5dfdd] transition-all duration-300 group-focus-within:text-[#ff6b7e]">
            Confirm Password
          </label>
          <div className={`relative rounded-2xl transition-all duration-300 ${
            focusedFields.confirm_password ? "shadow-[0_0_0_4px_rgba(255,107,126,0.1)]" : ""
          }`}>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6b7e]/20 to-[#ff8fa0]/20 opacity-0 transition-opacity duration-300 ${
              focusedFields.confirm_password ? "opacity-100" : ""
            }`}></div>
            <HiOutlineLockClosed className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg transition-all duration-300 ${
              focusedFields.confirm_password ? "text-[#ff6b7e] scale-110" : "text-white/40"
            }`} />
            <input
              {...register("confirm_password")}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your password"
              onFocus={() => handleFocus("confirm_password")}
              onBlur={() => handleBlur("confirm_password")}
              className={`relative h-14 w-full rounded-2xl border bg-white/8 pl-12 pr-14 text-[15px] font-medium text-[#fff7f6] caret-[#ff8ea0] outline-none transition-all duration-300 placeholder:text-[#b99896] focus:border-[#ff6b7e] ${
                errors.confirm_password 
                  ? "border-red-500/50 focus:border-red-500" 
                  : focusedFields.confirm_password 
                    ? "border-[#ff6b7e] bg-white/12" 
                    : "border-white/10 hover:border-white/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition-all duration-300 hover:text-[#ff6b7e] hover:scale-110"
            >
              {showConfirmPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
            </button>
            {watchedPassword && watchedPassword.length > 0 && !errors.confirm_password && watch("confirm_password") && (
              <HiOutlineCheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 text-green-500 text-base" />
            )}
          </div>
          {errors.confirm_password && (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-400 animate-fadeIn">
              <span className="inline-block h-1 w-1 rounded-full bg-red-400"></span>
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={registerMutation.isPending || isSubmitting}
          className="group relative mt-2 inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6b7e] to-[#ff8fa0] text-sm font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#ff6b7e]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
          </div>
          <span className="relative flex items-center gap-2">
            {registerMutation.isPending || isSubmitting ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <HiOutlineSparkles className="text-base" />
                <span>Sign Up</span>
              </>
            )}
          </span>
        </button>
        
        {/* Terms and Conditions */}
        <p className="text-center text-xs text-white/40">
          By signing up, you agree to our{" "}
          <Link to="/terms" className="text-[#ff6b7e] transition hover:text-[#ff8fa0]">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-[#ff6b7e] transition hover:text-[#ff8fa0]">
            Privacy Policy
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default Register;
