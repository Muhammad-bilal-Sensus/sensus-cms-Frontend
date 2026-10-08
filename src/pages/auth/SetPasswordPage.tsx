import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "../../components/ui/Button";
import { EyeIcon, LockIcon } from "../../components/ui/icons";
import { ROUTES } from "../../constants/routes";
import { resetPasswordRequest } from "../../services/authService";
import { getApiErrorMessage } from "../../utils/apiError";
import { clearPasswordResetDraft, readPasswordResetDraft, type PasswordResetDraft } from "../../services/passwordResetDraft";

const fieldClass =
  "h-[52px] w-full rounded-full bg-[#e7eef6] text-[15px] text-slate-700 outline-none placeholder:text-slate-400";

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state as PasswordResetDraft | null) ?? readPasswordResetDraft();
  const [email] = useState(incoming?.email?.trim() ?? "");
  const [otp] = useState(incoming?.otp ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmationError, setConfirmationError] = useState("");

  const otpReady = /^\d{6}$/.test(otp);

  useEffect(() => {
    if (!email || !otpReady) {
      navigate(email ? ROUTES.verifyOtp : ROUTES.resetPassword, {
        replace: true,
        state: email ? { email } : undefined,
      });
    }
  }, [email, otpReady, navigate]);

  const resetMutation = useMutation({
    mutationFn: (payload: { password: string; password_confirmation: string }) =>
      resetPasswordRequest({
        email,
        otp,
        password: payload.password,
        password_confirmation: payload.password_confirmation,
      }),
    onSuccess: (message) => {
      toast.success(message);
      clearPasswordResetDraft();
      navigate(ROUTES.login, { replace: true });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not reset the password."));
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPasswordError = password ? "" : "Enter a new password.";
    const nextConfirmationError = !confirmation
      ? "Confirm your password."
      : confirmation !== password
        ? "Passwords do not match."
        : "";
    setPasswordError(nextPasswordError);
    setConfirmationError(nextConfirmationError);
    if (nextPasswordError || nextConfirmationError) return;
    resetMutation.mutate({ password, password_confirmation: confirmation });
  }

  if (!email || !otpReady) return null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
      <p className="text-center text-sm text-white/70">Choose a new password.</p>
      <label className="relative block">
        <span className="sr-only">Email</span>
        <input readOnly value={email} aria-readonly="true" className={`${fieldClass} px-5 text-center`} />
      </label>

      <div>
        <label className="relative block">
          <span className="sr-only">Password</span>
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
            <LockIcon />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "new-password-error" : undefined}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordError) setPasswordError("");
            }}
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
          <p id="new-password-error" className="mt-1.5 px-4 text-xs text-rose-300">
            {passwordError}
          </p>
        ) : null}
      </div>

      <div>
        <label className="relative block">
          <span className="sr-only">Confirm password</span>
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
            <LockIcon />
          </span>
          <input
            type={showConfirmation ? "text" : "password"}
            name="password_confirmation"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmation}
            aria-invalid={Boolean(confirmationError)}
            aria-describedby={confirmationError ? "confirm-password-error" : undefined}
            onChange={(event) => {
              setConfirmation(event.target.value);
              if (confirmationError) setConfirmationError("");
            }}
            className={`${fieldClass} pr-12 pl-12`}
          />
          <Button
            type="button"
            onClick={() => setShowConfirmation((value) => !value)}
            height="auto"
            width="auto"
            color="#94a3b8"
            background="transparent"
            border="none"
            className="absolute top-1/2 right-4 -translate-y-1/2 hover:text-slate-600"
            aria-label={showConfirmation ? "Hide confirm password" : "Show confirm password"}
          >
            <EyeIcon off={showConfirmation} />
          </Button>
        </label>
        {confirmationError ? (
          <p id="confirm-password-error" className="mt-1.5 px-4 text-xs text-rose-300">
            {confirmationError}
          </p>
        ) : null}
      </div>

      <Button type="submit" text={resetMutation.isPending ? "WAIT" : "RESET"} disabled={resetMutation.isPending} />

      <Link to={ROUTES.verifyOtp} state={{ email }} className="mt-1 text-center text-[13px] text-white/80 hover:text-white">
        Back
      </Link>
    </form>
  );
}
