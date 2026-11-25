import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils/cn";

export function ConfirmDeleteForm({
  action,
  fields,
  title = "Xóa",
  description = "Không thể hoàn tác.",
  confirmLabel = "Xác nhận xóa",
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: { name: string; value: string }[];
  title?: string;
  description?: string;
  confirmLabel?: string;
  className?: string;
}) {
  return (
    <details className={cn("group", className)}>
      <summary className="cursor-pointer text-xs font-medium text-error">
        {title}
      </summary>
      <form
        action={action}
        className="mt-2 space-y-2 rounded-lg bg-error-container p-3"
      >
        {fields.map((field) => (
          <input
            key={field.name}
            type="hidden"
            name={field.name}
            value={field.value}
          />
        ))}
        <p className="text-xs leading-5 text-on-error-container">{description}</p>
        <SubmitButton size="sm" variant="danger" pendingText="Đang xóa…">
          {confirmLabel}
        </SubmitButton>
      </form>
    </details>
  );
}
