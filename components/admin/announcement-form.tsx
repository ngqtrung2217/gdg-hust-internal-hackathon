"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createAnnouncementAction } from "@/lib/actions/admin";
import { initialActionState } from "@/lib/actions/types";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { SubmitButton } from "@/components/ui/submit-button";

export function AnnouncementForm() {
  const [state, formAction] = useActionState(
    createAnnouncementAction,
    initialActionState,
  );
  useActionToast(state);
  const [body, setBody] = useState("");

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium text-on-surface">Đăng thông báo</h2>
      <p className="mt-1 text-sm leading-6 text-on-surface-variant">
        Markdown, link inline.
      </p>

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

      <form action={formAction} className="mt-4 space-y-4">
        <Field label="Tiêu đề" htmlFor="title">
          <Input id="title" name="title" required maxLength={160} />
        </Field>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field
            label="Nội dung"
            htmlFor="body_md"
            hint="Ví dụ: [Điền form](https://forms.gle/...)"
          >
            <Textarea
              id="body_md"
              name="body_md"
              required
              maxLength={10000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-64 font-mono text-xs leading-6"
              placeholder={"## Mốc thời gian\n\n- 20/12: chốt đội\n- 22/12: nộp ý tưởng"}
            />
          </Field>

          <div>
            <p className="text-sm font-medium text-on-surface">Preview</p>
            <div className="mt-2 min-h-64 max-h-[420px] overflow-y-auto rounded-xl border border-outline-variant bg-surface p-4">
              {body.trim() ? (
                <Markdown content={body} />
              ) : (
                <p className="text-sm text-on-surface-variant">
                  Nội dung render sẽ hiện ở đây.
                </p>
              )}
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
          <input
            type="checkbox"
            name="pinned"
            className="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
          />
          Ghim lên đầu trang Tổng quan
        </label>

        <SubmitButton pendingText="Đang đăng…">Đăng thông báo</SubmitButton>
      </form>
    </Card>
  );
}
