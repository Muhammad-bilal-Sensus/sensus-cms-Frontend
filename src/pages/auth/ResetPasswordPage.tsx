import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "../../components/ui/Button";
import { UserIcon } from "../../components/ui/icons";
import { ROUTES } from "../../constants/routes";
import { forgotPasswordRequest } from "../../services/authService";
import { getApiErrorMessage } from "../../utils/apiError";
import { readPasswordResetDraft, savePasswordResetDraft } from "../../services/passwordResetDraft";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "h-[52px] w-full rounded-full bg-[#e7eef6] text-[15px] text-slate-700 outline-none placeholder:text-slate-400";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = location.state as { email?: string } | null;
  const [email, setEmail] = useState(() => incoming?.email?.trim() || readPasswordResetDraft()?.email || "");
  const [emailError, setEmailError] = useState("");

  const sendMutation = useMutation({
    mutationFn: (value: string) => forgotPasswordRequest(value),
    onSuccess: (message, value) => {
      toast.success(message);
      const draft = { email: value };
      savePasswordResetDraft(draft);
      navigate(ROUTES.verifyOtp, { state: draft });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not send the code."));
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim();
    const nextEmailError = emailPattern.test(normalized) ? "" : "Enter a valid email address.";
    setEmailError(nextEmailError);
    if (nextEmailError) return;
    sendMutation.mutate(normalized);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
      <p className="mb-1 text-center text-sm text-white/70">Enter your email to reset your password.</p>
      <div>
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
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "reset-email-error" : undefined}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError("");
            }}
            className={`${fieldClass} pr-4 pl-12`}
          />
        </label>
        {emailError ? (
          <p id="reset-email-error" className="mt-1.5 px-4 text-xs text-rose-300">
            {emailError}
          </p>
        ) : null}
      </div>

      <Button type="submit" text={sendMutation.isPending ? "WAIT" : "SEND"} disabled={sendMutation.isPending} />

      <Link to={ROUTES.login} className="mt-1 text-center text-[13px] text-white/80 hover:text-white">
        Back to login
      </Link>
    </form>
  );
}
