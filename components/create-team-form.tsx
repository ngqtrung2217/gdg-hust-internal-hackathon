"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createTeamAction } from "@/lib/actions/team";
import { initialActionState } from "@/lib/actions/types";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import {
  MAX_DEVELOPERS_PER_TEAM,
  MAX_MARCOM_OPERATION_PER_TEAM,
} from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateTeamForm({
  disabled,
  disabledReason,
}: {
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, formAction] = useActionState(
    createTeamAction,
    initialActionState,
  );
  useActionToast(state);


  return (
    <Card className="p-6">
      <h2 className="text-xl font-medium tracking-tight text-on-surface">
        Tạo đội mới
      </h2>
      <p className="mt-1 text-sm leading-6 text-on-surface-variant">
        Bạn sẽ là đội trưởng. Đội gồm 3–5 người, tối đa{" "}
        {MAX_DEVELOPERS_PER_TEAM} Developer và{" "}
        {MAX_MARCOM_OPERATION_PER_TEAM} Marcom/Operation.
      </p>

      {disabled ? (
        <div className="mt-4 flex gap-2 rounded-xl bg-warning-container p-3 text-sm leading-6 text-on-warning-container">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {disabledReason ?? "BTC đã khóa thao tác tạo đội."}
        </div>
      ) : null}

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

      <form action={formAction} className="mt-5 space-y-4">
        <Field
          label="Tên đội"
          htmlFor="name"
          hint="Từ 2 đến 60 ký tự."
          error={state.fieldErrors?.name}
        >
          <Input
            id="name"
            name="name"
            placeholder="Tên đội của bạn"
            required
            disabled={disabled}
          />
        </Field>

        <Field
          label="Mô tả"
          htmlFor="description"
          hint="Ý tưởng, track hoặc điều bạn đang tìm ở đồng đội."
          error={state.fieldErrors?.description}
        >
          <Textarea
            id="description"
            name="description"
            placeholder="Mục tiêu, track, hoặc role bạn đang tìm."
            disabled={disabled}
          />
        </Field>

        <SubmitButton
          className="w-full"
          disabled={disabled}
          pendingText="Đang tạo đội…"
        >
          Tạo đội
        </SubmitButton>
      </form>
    </Card>
  );
}
