import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "outline";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  primary: "bg-primary-container text-on-primary-container",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  error: "bg-error-container text-on-error-container",
  outline: "border border-outline-variant text-on-surface-variant",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium leading-4",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
