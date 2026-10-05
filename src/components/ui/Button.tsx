import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  text?: string;
  height?: CSSProperties["height"];
  width?: CSSProperties["width"];
  color?: string;
  background?: string;
  border?: string;
  variant?: ButtonVariant;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "color">;

const variants: Record<ButtonVariant, { height: number; width: CSSProperties["width"]; color: string; background: string; border: string }> = {
  primary: { height: 40, width: "auto", color: "#ffffff", background: "#0f766e", border: "none" },
  secondary: { height: 40, width: "auto", color: "#334155", background: "#ffffff", border: "1px solid #cbd5e1" },
};

export default function Button({
  text,
  height,
  width,
  color,
  background,
  border,
  variant,
  onClick,
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const preset = variant ? variants[variant] : undefined;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full font-medium cursor-pointer transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${
        variant ? "px-5 text-sm" : "text-[13px] tracking-[0.22em]"
      } ${className}`}
      style={{
        height: height ?? preset?.height ?? 50,
        width: width ?? preset?.width ?? "100%",
        color: color ?? preset?.color ?? "#0f172a",
        background: background ?? preset?.background ?? "#ffffff",
        border: border ?? preset?.border ?? "none",
      }}
      {...rest}
    >
      {text ?? children}
    </button>
  );
}
