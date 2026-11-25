"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import {
  deleteAllowlistAction,
  saveAllowlistAction,
} from "@/lib/actions/admin";
import type { AllowlistRow } from "@/types/db";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function AllowlistEditDialog({ row }: { row: AllowlistRow }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [open]);

  function close() {
    dialogRef.current?.close();
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Sửa
      </Button>

      {open ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={`${formId}-title`}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const outside =
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom;
            if (outside) close();
          }}
          className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto rounded-xl border border-outline-variant bg-surface p-0 text-left text-on-surface shadow-elevation-3 backdrop:bg-scrim"
        >
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-5 sm:p-6">
            <div className="min-w-0">
              <h2
                id={`${formId}-title`}
                className="text-lg font-medium text-on-surface"
              >
                Sửa quyền truy cập
              </h2>
              <p className="mt-1 break-all font-mono text-xs text-on-surface-variant">
                {row.email}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Đóng"
              onClick={close}
              className="h-11 w-11 shrink-0 p-0"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <form action={saveAllowlistAction} className="space-y-5 p-5 sm:p-6">
            <input type="hidden" name="email" value={row.email} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Họ tên"
                htmlFor={`${formId}-full-name`}
                className="sm:col-span-2"
              >
                <Input
                  id={`${formId}-full-name`}
                  name="full_name"
                  defaultValue={row.full_name ?? ""}
                  autoComplete="name"
                />
              </Field>

              <Field label="MSSV" htmlFor={`${formId}-student-id`}>
                <Input
                  id={`${formId}-student-id`}
                  name="student_id"
                  defaultValue={row.student_id ?? ""}
                  inputMode="numeric"
                />
              </Field>

              <Field
                label="Khóa"
                htmlFor={`${formId}-cohort`}
                hint="Ví dụ: K70, K71"
              >
                <Input
                  id={`${formId}-cohort`}
                  name="cohort"
                  defaultValue={row.cohort ?? ""}
                />
              </Field>

              <Field
                label="Ngành học"
                htmlFor={`${formId}-major`}
                className="sm:col-span-2"
              >
                <Input
                  id={`${formId}-major`}
                  name="major"
                  defaultValue={row.major ?? ""}
                />
              </Field>

              <Field label="Vai trò" htmlFor={`${formId}-role`}>
                <Select
                  id={`${formId}-role`}
                  name="role"
                  defaultValue={row.role}
                >
                  <option value="participant">Thí sinh</option>
                  <option value="admin">BTC</option>
                </Select>
              </Field>

              <Field
                label="Trạng thái"
                htmlFor={`${formId}-active`}
                hint="Tắt để thu hồi quyền truy cập."
              >
                <label className="flex h-12 cursor-pointer items-center gap-3 rounded-md border border-outline-variant px-4">
                  <input
                    id={`${formId}-active`}
                    type="checkbox"
                    name="active"
                    defaultChecked={row.active}
                    className="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface">
                    Cho phép đăng nhập
                  </span>
                </label>
              </Field>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-outline-variant pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={close}>
                Hủy
              </Button>
              <SubmitButton pendingText="Đang lưu…">Lưu thay đổi</SubmitButton>
            </div>
          </form>

          <div className="border-t border-outline-variant bg-surface-container/50 p-5 sm:p-6">
            <p className="text-sm font-medium text-on-surface">
              Thu hồi quyền truy cập
            </p>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">
              Xóa email khỏi danh sách. Người này sẽ không đăng nhập được nữa.
            </p>
            <form action={deleteAllowlistAction} className="mt-3">
              <input type="hidden" name="email" value={row.email} />
              <ConfirmSubmitButton
                size="sm"
                variant="danger"
                confirmText={`Xóa ${row.email} khỏi danh sách?`}
                pendingText="Đang xóa…"
              >
                Xóa email
              </ConfirmSubmitButton>
            </form>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
