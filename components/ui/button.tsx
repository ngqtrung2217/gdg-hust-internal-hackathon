import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "primary"
  | "tonal"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active",
  tonal:
    "bg-primary-container text-on-primary-container hover:bg-[#c2d7fb]",
  outline:
    "border border-outline bg-transparent text-primary hover:bg-primary-container/50",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
  danger:
    "bg-error text-white hover:bg-[#9f211b] focus-visible:ring-error",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-6 text-sm",
  lg: "h-12 px-7 text-base",
};

export function buttonClass(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    base,
    variants[options?.variant ?? "primary"],
    sizes[options?.size ?? "md"],
    options?.className,
  );
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}
