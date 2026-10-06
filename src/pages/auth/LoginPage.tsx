import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "../../components/ui/Button";
import { EyeIcon, LockIcon, UserIcon } from "../../components/ui/icons";
import { pathAfterLogin, ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/apiError";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "h-[52px] w-full rounded-full bg-[#e7eef6] text-[15px] text-slate-700 outline-none placeholder:text-slate-400";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) => login(payload.email, payload.password),
    onSuccess: (message) => {
      toast.success(message);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(pathAfterLogin(from), { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Login failed."));
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim();
    if (!emailPattern.test(normalized)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (!password) {
      toast.error("Enter your password.");
      return;
    }
    loginMutation.mutate({ email: normalized, password });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
      <label className="relative block">
        <span className="sr-only">Email</span>
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
          <UserIcon />
        </span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`${fieldClass} pr-4 pl-12`}
        />
      </label>

      <label className="relative block">
        <span className="sr-only">Password</span>
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
          <LockIcon />
        </span>
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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

      <Button type="submit" text={loginMutation.isPending ? "WAIT" : "LOGIN"} disabled={loginMutation.isPending} />

      <Link to={ROUTES.resetPassword} className="mt-1 text-center text-[13px] text-white/80 hover:text-white">
        Reset Password
      </Link>
    </form>
  );
}
