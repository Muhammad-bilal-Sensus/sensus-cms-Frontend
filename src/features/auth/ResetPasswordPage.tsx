import { useSchemaForm } from "@/hooks/useSchemaForm";
import { resetEmailSchema } from "./authSchemas";
import { useForgotPasswordMutation } from "@/redux/api/authApi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { UserIcon } from "@/components/icons/FormIcons";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/utils/apiError";
import { readPasswordResetDraft, savePasswordResetDraft } from "./passwordResetDraft";

const fieldClass =
  "h-[52px] w-full rounded-full bg-[#e7eef6] text-[15px] text-slate-700 outline-none placeholder:text-slate-400";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = location.state as { email?: string } | null;
  const form = useSchemaForm(resetEmailSchema, { email: incoming?.email?.trim() || readPasswordResetDraft()?.email || "" });
  const emailError = form.formState.errors.email?.message ?? "";

  const [sendCode, sendMutation] = useForgotPasswordMutation();

  async function submitEmail(value: string) {
    try {
      const message = await sendCode(value).unwrap();
      toast.success(message);
      const draft = { email: value };
      savePasswordResetDraft(draft);
      navigate(ROUTES.verifyOtp, { state: draft });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not send the code."));
    }
  }

  async function onSubmit(values: { email: string }) {
    if (!sendMutation.isLoading) await submitEmail(values.email.trim());
  }

  return (
    <form onSubmit={form.submitForm(onSubmit)} className="flex flex-col gap-3.5" noValidate>
      <p className="mb-1 text-center text-sm text-white/70">Enter your email to reset your password.</p>
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
            aria-describedby={emailError ? "reset-email-error" : undefined}
            className={`${fieldClass} pr-4 pl-12`}
          />
        </label>
        {emailError ? (
          <p id="reset-email-error" className="mt-1.5 px-4 text-xs text-rose-300">
            {emailError}
          </p>
        ) : null}
      </div>

      <Button type="submit" text={sendMutation.isLoading ? "WAIT" : "SEND"} disabled={sendMutation.isLoading} />

      <Link to={ROUTES.login} className="mt-1 text-center text-[13px] text-white/80 hover:text-white">
        Back to login
      </Link>
    </form>
  );
}
