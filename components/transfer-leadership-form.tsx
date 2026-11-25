"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { transferLeadershipAction } from "@/lib/actions/team";
import { Field, Select } from "@/components/ui/input";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export function TransferLeadershipForm({
  teamId,
  members,
}: {
  teamId: string;
  members: { id: string; name: string }[];
}) {
  const [newLeaderId, setNewLeaderId] = useState("");
  const newLeader = members.find((member) => member.id === newLeaderId);

  return (
    <form action={transferLeadershipAction} className="space-y-3">
      <input type="hidden" name="team_id" value={teamId} />
      <Field
        label="Chuyển đội trưởng cho"
        htmlFor="new_leader_id"
        hint="Người được chọn sẽ quản lý đội; bạn trở thành thành viên."
      >
        <Select
          id="new_leader_id"
          name="new_leader_id"
          value={newLeaderId}
          onChange={(event) => setNewLeaderId(event.target.value)}
          required
        >
          <option value="" disabled>
            Chọn thành viên
          </option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
      </Field>
      <ConfirmSubmitButton
        variant="outline"
        className="w-full"
        disabled={!newLeader}
        confirmText={
          newLeader
            ? `Chuyển quyền đội trưởng cho ${newLeader.name}?`
            : "Chuyển quyền đội trưởng?"
        }
        pendingText="Đang chuyển…"
      >
        <ArrowRightLeft className="h-4 w-4" aria-hidden />
        Chuyển quyền
      </ConfirmSubmitButton>
    </form>
  );
}
