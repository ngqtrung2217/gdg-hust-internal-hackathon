"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Link2 } from "lucide-react";
import {
  createInviteLinkAction,
  type InviteLinkState,
} from "@/lib/actions/team";
import { formatDateTime } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast } from "@/lib/hooks/use-action-toast";

const initialState: InviteLinkState = { ok: false };

export function InviteLinkCard({
  teamId,
  remainingSlots,
  recruiting,
}: {
  teamId: string;
  remainingSlots: number;
  recruiting: boolean;
}) {
  const [state, formAction] = useActionState(
    createInviteLinkAction,
    initialState,
  );
  useActionToast(state);
  const full = remainingSlots < 1;
  const paused = !recruiting;
  const [copyState, setCopyState] = useState<{
    url: string;
    status: "copied" | "failed";
  } | null>(null);
  const copiedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!state.url || copiedUrl.current === state.url) return;

    const url = state.url;
    copiedUrl.current = url;

    const copy = navigator.clipboard
      ? navigator.clipboard.writeText(url)
      : Promise.reject(new Error("Clipboard unavailable"));

    copy
      .then(() => setCopyState({ url, status: "copied" }))
      .catch(() => setCopyState({ url, status: "failed" }));
  }, [state.url]);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-on-surface-variant" aria-hidden />
          <h2 className="text-base font-medium text-on-surface">Link mời</h2>
        </div>
        <Badge tone={paused || full ? "warning" : "neutral"}>
          {paused
            ? "Tạm dừng tuyển"
            : full
              ? "Đội đã đủ"
              : `${remainingSlots} chỗ trống`}
        </Badge>
      </div>

      {paused ? (
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Mở tuyển trước khi tạo link mời.
        </p>
      ) : null}

      <form action={formAction} className="mt-4">
        <input type="hidden" name="team_id" value={teamId} />
        <SubmitButton
          className="w-full"
          pendingText="Đang tạo link…"
          disabled={paused || full}
        >
          <Link2 className="h-4 w-4" aria-hidden />
          Tạo link mời
        </SubmitButton>
      </form>

      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok
              ? "mt-3 text-sm text-on-success-container"
              : "mt-3 text-sm text-error"
          }
        >
          {state.message}
        </p>
      ) : null}

      {state.url ? (
        <div className="mt-3 rounded-xl border border-outline-variant bg-surface-container p-3">
          <Input
            readOnly
            value={state.url}
            aria-label="Link mời"
            className="h-10 bg-surface font-mono text-xs"
            onFocus={(event) => event.currentTarget.select()}
          />
          <CopyButton
            value={state.url}
            label="Sao chép link"
            className="mt-2 w-full"
          />
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            Hiệu lực đến {formatDateTime(state.expiresAt)}
            {state.maxUses ? ` · tối đa ${state.maxUses} lượt dùng` : ""}.
          </p>
          {copyState?.url === state.url && copyState.status === "copied" ? (
            <p className="mt-1 text-xs text-success">Đã tự động copy link.</p>
          ) : copyState?.url === state.url && copyState.status === "failed" ? (
            <p className="mt-1 text-xs text-error">
              Chưa copy được, bấm Sao chép.
            </p>
          ) : null}
        </div>
      ) : null}

      {!full ? (
        <p className="mt-3 text-xs leading-5 text-on-surface-variant">
          Người nhận cần đăng nhập bằng email BTC đã duyệt.
        </p>
      ) : null}
    </Card>
  );
}
