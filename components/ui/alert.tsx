import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Alert({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-2 rounded-xl border border-error/20 bg-error-container p-4 text-sm text-on-error-container",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("leading-6", className)} {...props} />;
}
