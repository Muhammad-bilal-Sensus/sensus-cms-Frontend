import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";
import { verifyOtpRequest } from "../../services/authService";
import { getApiErrorMessage } from "../../utils/apiError";
import OtpInput from "./OtpInput";
import { readPasswordResetDraft, savePasswordResetDraft, type PasswordResetDraft } from "../../services/passwordResetDraft";

const fieldClass =
  "h-[52px] w-full rounded-full bg-[#e7eef6] text-[15px] text-slate-700 outline-none";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state as PasswordResetDraft | null) ?? readPasswordResetDraft();
  const [email] = useState(incoming?.email?.trim() ?? "");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (!email) {
      navigate(ROUTES.resetPassword, { replace: true });
      return;
    }
    savePasswordResetDraft({ email });
  }, [email, navigate]);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => verifyOtpRequest(email, code),
    onSuccess: (message, code) => {
      toast.success(message);
      const draft = { email, otp: code };
      savePasswordResetDraft(draft);
      navigate(ROUTES.setPassword, { state: draft });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not verify the code."));
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = otp.replace(/\D/g, "");
    const nextOtpError = /^\d{6}$/.test(code) ? "" : "Enter the 6-digit code.";
    setOtpError(nextOtpError);
    if (nextOtpError) return;
    verifyMutation.mutate(code);
  }

  if (!email) return null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
      <p className="text-center text-sm text-white/70">Enter the code sent to this email.</p>
      <label className="relative block">
        <span className="sr-only">Email</span>
        <input readOnly value={email} aria-readonly="true" className={`${fieldClass} px-5 text-center`} />
      </label>
      <div>
        <OtpInput
          value={otp}
          invalid={Boolean(otpError)}
          disabled={verifyMutation.isPending}
          onChange={(next) => {
            setOtp(next);
            if (otpError) setOtpError("");
          }}
        />
        {otpError ? (
          <p id="verify-otp-error" className="mt-1.5 text-center text-xs text-rose-300">
            {otpError}
          </p>
        ) : null}
      </div>

      <Button type="submit" text={verifyMutation.isPending ? "WAIT" : "VERIFY"} disabled={verifyMutation.isPending} />

      <Link to={ROUTES.resetPassword} state={{ email }} className="mt-1 text-center text-[13px] text-white/80 hover:text-white">
        Use a different email
      </Link>
    </form>
  );
}
