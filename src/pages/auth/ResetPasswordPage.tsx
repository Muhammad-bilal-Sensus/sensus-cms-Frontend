import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!emailPattern.test(normalized)) {
      setError("Enter a valid email address.");
      setSent(false);
      return;
    }
    setError(null);
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
      <p className="mb-1 text-center text-sm text-white/70">Enter your email to reset your password.</p>
      <label className="block">
        <span className="sr-only">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-[52px] w-full rounded-full bg-[#e7eef6] px-5 text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
        />
      </label>

      {error && <p className="text-center text-xs text-rose-300">{error}</p>}
      {sent && (
        <p className="text-center text-xs text-white/75">
          If an account exists for this email, reset instructions have been sent.
        </p>
      )}

      <Button type="submit" text="SEND" />

      <Link to={ROUTES.login} className="mt-1 text-center text-[13px] text-white/80 hover:text-white">
        Back to login
      </Link>
    </form>
  );
}
