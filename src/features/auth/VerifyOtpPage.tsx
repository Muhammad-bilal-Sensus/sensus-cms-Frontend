import { useController } from "react-hook-form";
import { useSchemaForm } from "@/hooks/useSchemaForm";
import { otpSchema } from "./authSchemas";
import { useEffect, useState } from "react";
import { useVerifyOtpMutation } from "@/redux/api/authApi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/apiError";
import OtpInput from "./components/OtpInput";
import { readPasswordResetDraft, savePasswordResetDraft, type PasswordResetDraft } from "./passwordResetDraft";

const fieldClass =
  "h-[52px] w-full rounded-full bg-[#e7eef6] text-[15px] text-slate-700 outline-none";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state as PasswordResetDraft | null) ?? readPasswordResetDraft();
  const [email] = useState(incoming?.email?.trim() ?? "");
  const form = useSchemaForm(otpSchema, { otp: "" });
  const { field: otpField } = useController({ name: "otp", control: form.control });
  const otpError = form.formState.errors.otp?.message ?? "";

  useEffect(() => {
    if (!email) {
      navigate(ROUTES.resetPassword, { replace: true });
      return;
    }
    savePasswordResetDraft({ email });
  }, [email, navigate]);

  const [verifyOtp, verifyMutation] = useVerifyOtpMutation();

  async function submitCode(code: string) {
    try {
      const message = await verifyOtp({ email, otp: code }).unwrap();
      toast.success(message);
      const draft = { email, otp: code };
      savePasswordResetDraft(draft);
      navigate(ROUTES.setPassword, { state: draft });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not verify the code."));
    }
  }

  async function onSubmit(values: { otp: string }) {
    if (!verifyMutation.isLoading) await submitCode(values.otp.replace(/\D/g, ""));
  }

  if (!email) return null;

  return (
    <form onSubmit={form.submitForm(onSubmit)} className="flex flex-col gap-3.5" noValidate>
      <p className="text-center text-sm text-white/70">Enter the code sent to this email.</p>
      <label className="relative block">
        <span className="sr-only">Email</span>
        <input readOnly value={email} aria-readonly="true" className={`${fieldClass} px-5 text-center`} />
      </label>
      <div>
        <OtpInput
          value={otpField.value}
          inputRef={otpField.ref}
          onBlur={otpField.onBlur}
          invalid={Boolean(otpError)}
          disabled={verifyMutation.isLoading}
          onChange={(next) => {
            otpField.onChange(next);
            form.clearErrors("otp");
          }}
        />
        {otpError ? (
          <p id="verify-otp-error" className="mt-1.5 text-center text-xs text-rose-300">
            {otpError}
          </p>
        ) : null}
      </div>

      <Button type="submit" text={verifyMutation.isLoading ? "WAIT" : "VERIFY"} disabled={verifyMutation.isLoading} />

      <Link to={ROUTES.resetPassword} state={{ email }} className="mt-1 text-center text-[13px] text-white/80 hover:text-white">
        Use a different email
      </Link>
    </form>
  );
}
