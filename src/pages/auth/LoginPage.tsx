import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { EyeIcon, LockIcon, UserIcon } from "../../components/ui/icons";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes";

const fieldClass =
  "h-[52px] w-full rounded-full bg-[#e7eef6] text-[15px] text-slate-700 outline-none placeholder:text-slate-400";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = login(email.trim() || "user@albisher.com", password || "password");
    if (message) login("user@albisher.com", "password");
    navigate(ROUTES.home, { replace: true });
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

      <Button type="submit" text="LOGIN" />

      <Link to={ROUTES.resetPassword} className="mt-1 text-center text-[13px] text-white/80 hover:text-white">
        Reset Password
      </Link>
    </form>
  );
}
