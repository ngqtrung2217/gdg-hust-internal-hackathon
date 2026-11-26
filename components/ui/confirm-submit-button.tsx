"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

// Always confirm inline: native window.confirm can be suppressed by the
// browser, which made destructive buttons silently do nothing.
export function ConfirmSubmitButton({
  confirmText,
  children,
  pendingText = "Đang xử lý…",
  onClick,
  ...props
}: ButtonProps & { confirmText: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        {...props}
        type="submit"
        onClick={(event) => {
          event.preventDefault();
          setConfirming(true);
          onClick?.(event);
        }}
      >
        {children}
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-label={confirmText}
      className="rounded-xl border border-outline-variant bg-surface-container p-3"
    >
      <p className="text-xs leading-5 text-on-surface-variant">{confirmText}</p>
      <div className="mt-2 flex gap-2">
        <Button
          type="submit"
          size="sm"
          variant="danger"
          className="flex-1"
          disabled={pending || props.disabled}
        >
          {pending ? pendingText : "Xác nhận"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Hủy
        </Button>
      </div>
    </div>
  );
}
