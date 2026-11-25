"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

export function SubmitButton({
  children,
  pendingText = "Đang xử lý…",
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
    >
      {pending ? pendingText : children}
    </Button>
  );
}
