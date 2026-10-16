import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { PencilIcon, TrashIcon } from "@/components/icons/Icon";

export const ButtonVariant = {
  primary: "primary",
  secondary: "secondary",
  icon: "icon",
  edit: "edit",
  delete: "delete",
} as const;

export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];

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

const sizedVariants: Record<"primary" | "secondary", { height: number; width: CSSProperties["width"]; color: string; background: string; border: string }> = {
  [ButtonVariant.primary]: { height: 40, width: "auto", color: "#ffffff", background: "#0f766e", border: "none" },
  [ButtonVariant.secondary]: { height: 40, width: "auto", color: "#334155", background: "#ffffff", border: "1px solid #cbd5e1" },
};

const iconClassName: Partial<Record<ButtonVariant, string>> = {
  [ButtonVariant.icon]: "h-8 w-8 text-teal-700 hover:bg-teal-50",
  [ButtonVariant.edit]: "h-8 w-8 text-teal-700 hover:bg-teal-50",
  [ButtonVariant.delete]: "h-8 w-8 text-rose-600 hover:bg-rose-50",
};

function iconFor(variant: ButtonVariant | undefined) {
  if (variant === ButtonVariant.edit) return <PencilIcon />;
  if (variant === ButtonVariant.delete) return <TrashIcon />;
  return null;
}

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
  const preset = variant === ButtonVariant.primary || variant === ButtonVariant.secondary ? sizedVariants[variant] : undefined;
  const iconClasses = variant ? iconClassName[variant] : undefined;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full font-medium cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-50 ${
        iconClasses ?? (variant ? "px-5 text-sm hover:brightness-95" : "text-[13px] tracking-[0.22em] hover:brightness-95")
      } ${className}`}
      style={
        iconClasses
          ? undefined
          : {
              height: height ?? preset?.height ?? 50,
              width: width ?? preset?.width ?? "100%",
              color: color ?? preset?.color ?? "#0f172a",
              background: background ?? preset?.background ?? "#ffffff",
              border: border ?? preset?.border ?? "none",
            }
      }
      {...rest}
    >
      {text ?? children ?? iconFor(variant)}
    </button>
  );
}
