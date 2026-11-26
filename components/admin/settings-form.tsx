"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateSettingsAction } from "@/lib/actions/admin";
import { initialActionState } from "@/lib/actions/types";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import { toDatetimeLocal } from "@/lib/utils/date";
import type { AppSettings } from "@/types/db";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction] = useActionState(
    updateSettingsAction,
    initialActionState,
  );
  useActionToast(state);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium text-on-surface">Cấu hình cuộc thi</h2>

      {state.message ? (
        <div
          role={state.ok ? "status" : "alert"}
          className={
            state.ok
              ? "mt-4 flex items-center gap-2 rounded-xl bg-success-container p-3 text-sm text-on-success-container"
              : "mt-4 flex items-center gap-2 rounded-xl bg-error-container p-3 text-sm text-on-error-container"
          }
        >
          {state.ok ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden />
          )}
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="mt-5 space-y-5">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline-variant p-4">
          <input
            type="checkbox"
            name="allowlist_mode"
            defaultChecked={settings.allowlist_mode}
            className="mt-0.5 h-4 w-4 rounded border-outline text-primary focus:ring-primary"
          />
          <span>
            <span className="block text-sm font-medium text-on-surface">
              Chỉ email trong danh sách được đăng nhập
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-on-surface-variant">
              Tắt để cho phép người ngoài danh sách tự tạo hồ sơ thí sinh. Admin
              vẫn luôn phải nằm trong danh sách.
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Số thành viên tối đa"
            htmlFor="max_team_size"
            hint="Theo thể lệ: từ 3 đến 5."
          >
            <Input
              id="max_team_size"
              name="max_team_size"
              type="number"
              min={3}
              max={5}
              defaultValue={settings.max_team_size}
              required
            />
          </Field>

          <Field
            label="Deadline chốt đội"
            htmlFor="team_creation_deadline"
            hint="Để trống nếu chưa đặt."
          >
            <Input
              id="team_creation_deadline"
              name="team_creation_deadline"
              type="datetime-local"
              defaultValue={toDatetimeLocal(settings.team_creation_deadline)}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline-variant p-4">
          <input
            type="checkbox"
            name="teams_locked"
            defaultChecked={settings.teams_locked}
            className="mt-0.5 h-4 w-4 rounded border-outline text-primary focus:ring-primary"
          />
          <span>
            <span className="block text-sm font-medium text-on-surface">
              Khóa toàn bộ thao tác đội
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-on-surface-variant">
              Chặn tạo đội, mời, xin vào và duyệt đơn. Dữ liệu hiện có vẫn xem
              được.
            </span>
          </span>
        </label>

        <SubmitButton pendingText="Đang lưu…">Lưu cấu hình</SubmitButton>
      </form>
    </Card>
  );
}
