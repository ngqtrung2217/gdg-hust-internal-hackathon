"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateAnnouncementAction } from "@/lib/actions/admin";
import { initialActionState } from "@/lib/actions/types";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import type { Announcement } from "@/types/db";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { SubmitButton } from "@/components/ui/submit-button";

export function AnnouncementEditForm({
  announcement,
}: {
  announcement: Announcement;
}) {
  const [state, formAction] = useActionState(
    updateAnnouncementAction,
    initialActionState,
  );
  useActionToast(state);
  const [body, setBody] = useState(announcement.body_md);

  return (
    <div className="mt-3 rounded-xl border border-outline-variant bg-surface p-4">
      {state.message ? (
        <div
          role={state.ok ? "status" : "alert"}
          className={
            state.ok
              ? "mb-3 flex items-center gap-2 rounded-lg bg-success-container p-2 text-xs text-on-success-container"
              : "mb-3 flex items-center gap-2 rounded-lg bg-error-container p-2 text-xs text-on-error-container"
          }
        >
          {state.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          )}
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={announcement.id} />

        <Field label="Tiêu đề" htmlFor={`title-${announcement.id}`}>
          <Input
            id={`title-${announcement.id}`}
            name="title"
            defaultValue={announcement.title}
            required
            maxLength={160}
          />
        </Field>

        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Nội dung" htmlFor={`body-${announcement.id}`}>
            <Textarea
              id={`body-${announcement.id}`}
              name="body_md"
              required
              maxLength={10000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-48 font-mono text-xs leading-6"
            />
          </Field>

          <div>
            <p className="text-xs font-medium text-on-surface">Preview</p>
            <div className="mt-1 max-h-64 min-h-48 overflow-y-auto rounded-lg border border-outline-variant p-3">
              <Markdown content={body} />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-on-surface">
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={announcement.pinned}
            className="h-4 w-4 rounded border-outline text-primary"
          />
          Ghim
        </label>

        <SubmitButton size="sm" pendingText="Đang lưu…">
          Lưu thay đổi
        </SubmitButton>
      </form>
    </div>
  );
}
