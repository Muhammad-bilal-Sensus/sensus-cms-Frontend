import { useSchemaForm } from "@/hooks/useSchemaForm";
import { loginSchema, type LoginFormValues } from "./authSchemas";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { EyeIcon, LockIcon, UserIcon } from "@/components/icons/FormIcons";
import { pathAfterLogin, ROUTES } from "@/constants/routes";
import { useAuth } from "./useAuth";
import { getApiErrorMessage } from "@/utils/apiError";

const fieldClass =
  "h-[52px] w-full rounded-full bg-[#e7eef6] text-[15px] text-slate-700 outline-none placeholder:text-slate-400";

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useSchemaForm(loginSchema, { email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const emailError = form.formState.errors.email?.message ?? "";
  const passwordError = form.formState.errors.password?.message ?? "";

  async function submitLogin(email: string, password: string) {
    try {
      const message = await login(email, password);
      toast.success(message);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(pathAfterLogin(from), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Login failed."));
    }
  }

  async function onSubmit(values: LoginFormValues) {
    if (!isLoggingIn) await submitLogin(values.email.trim(), values.password);
  }

  return (
    <form onSubmit={form.submitForm(onSubmit)} className="flex flex-col gap-3.5" noValidate>
      <div>
        <label className="relative block">
          <span className="sr-only">Email</span>
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
            <UserIcon />
          </span>
          <input
            type="email"
            {...form.register("email", { onChange: () => form.clearErrors("email") })}
            autoComplete="username"
            placeholder="Email"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "login-email-error" : undefined}
            className={`${fieldClass} pr-4 pl-12`}
          />
        </label>
        {emailError ? (
          <p id="login-email-error" className="mt-1.5 px-4 text-xs text-rose-300">
            {emailError}
          </p>
        ) : null}
      </div>

      <div>
        <label className="relative block">
          <span className="sr-only">Password</span>
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
            <LockIcon />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            {...form.register("password", { onChange: () => form.clearErrors("password") })}
            autoComplete="current-password"
            placeholder="Password"
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "login-password-error" : undefined}
            className={`${fieldClass} pr-12 pl-12`}
          />
          <Button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            height="auto"
            width="auto"
            color="#94a3b8"
            background="transparent"
            border="none"
            className="absolute top-1/2 right-4 -translate-y-1/2 hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <EyeIcon off={showPassword} />
          </Button>
        </label>
        {passwordError ? (
          <p id="login-password-error" className="mt-1.5 px-4 text-xs text-rose-300">
            {passwordError}
          </p>
        ) : null}
      </div>

      <Button type="submit" text={isLoggingIn ? "WAIT" : "LOGIN"} disabled={isLoggingIn} />

      <Link to={ROUTES.resetPassword} className="mt-1 text-center text-[13px] text-white/80 hover:text-white">
        Reset Password
      </Link>
    </form>
  );
}
