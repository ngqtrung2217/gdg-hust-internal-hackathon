"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { importAllowlistAction } from "@/lib/actions/admin";
import { initialActionState } from "@/lib/actions/types";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function AllowlistImportForm() {
  const [state, formAction] = useActionState(
    importAllowlistAction,
    initialActionState,
  );
  useActionToast(state);
  const [csv, setCsv] = useState("");

  async function readFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium text-on-surface">Import danh sách</h2>
      <p className="mt-1 text-sm leading-6 text-on-surface-variant">
        Cột:{" "}
        <code className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-xs">
          email,full_name,student_id,major,cohort,role,active
        </code>
        . Dòng tiêu đề được bỏ qua. Email trùng sẽ cập nhật.
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

      <form action={formAction} className="mt-4 space-y-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-3 text-sm text-on-surface-variant hover:bg-surface-container">
          <Upload className="h-4 w-4" aria-hidden />
          Chọn file CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              void readFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>

        <Textarea
          name="csv"
          required
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          spellCheck={false}
          className="min-h-56 font-mono text-xs leading-6"
          placeholder={`email,full_name,student_id,major,cohort,role,active
an.nguyen@example.com,Nguyen Minh An,2021xxxxx,Khoa hoc may tinh,K71,participant,true
btc@example.com,BTC Admin,,,K70,admin,true`}
          aria-label="Dữ liệu CSV"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-on-surface-variant">
            Tối đa 500 dòng mỗi lần.
          </p>
          <SubmitButton pendingText="Đang import…">Import danh sách</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
