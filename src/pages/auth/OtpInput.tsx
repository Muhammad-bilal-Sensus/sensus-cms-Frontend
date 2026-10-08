import { useRef } from "react";

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
};

export default function OtpInput({ value, onChange, disabled = false, invalid = false }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => {
    const char = value[index] ?? "";
    return /\d/.test(char) ? char : "";
  });

  function commit(nextDigits: string[], focusIndex: number) {
    onChange(nextDigits.map((digit) => (/\d/.test(digit) ? digit : " ")).join(""));
    refs.current[Math.min(Math.max(focusIndex, 0), OTP_LENGTH - 1)]?.focus();
  }

  return (
    <div className="grid grid-cols-6 gap-2" role="group" aria-label="One-time code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={index === 0}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid}
          className={`h-14 w-full min-w-0 rounded-2xl bg-[#e7eef6] text-center text-lg font-semibold text-slate-800 outline-none focus:ring-2 disabled:opacity-60 ${
            invalid ? "ring-2 ring-rose-400" : "focus:ring-white/80"
          }`}
          onChange={(event) => {
            const raw = event.target.value.replace(/\D/g, "");
            if (!raw) {
              const nextDigits = digits.slice();
              nextDigits[index] = "";
              commit(nextDigits, index);
              return;
            }
            if (raw.length > 1) {
              const nextDigits = Array.from({ length: OTP_LENGTH }, (_, digitIndex) => raw[digitIndex] ?? "");
              commit(nextDigits, Math.min(raw.length, OTP_LENGTH) - 1);
              return;
            }
            const nextDigits = digits.slice();
            nextDigits[index] = raw;
            commit(nextDigits, raw && index < OTP_LENGTH - 1 ? index + 1 : index);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              event.preventDefault();
              const nextDigits = digits.slice();
              nextDigits[index - 1] = "";
              commit(nextDigits, index - 1);
            }
            if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
            if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
            if (!pasted) return;
            event.preventDefault();
            const nextDigits = Array.from({ length: OTP_LENGTH }, (_, digitIndex) => pasted[digitIndex] ?? "");
            commit(nextDigits, pasted.length - 1);
          }}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
