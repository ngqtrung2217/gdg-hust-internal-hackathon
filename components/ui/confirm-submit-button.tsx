"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

export function ConfirmSubmitButton({
  confirmText,
  children,
  pendingText = "Đang xử lý…",
  ...props
}: ButtonProps & { confirmText: string; pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      onClick={(event) => {
        if (!window.confirm(confirmText)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingText : children}
    </Button>
  );
}
