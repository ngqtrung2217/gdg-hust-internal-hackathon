"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { publicEnv } from "@/lib/env";
import { INVITE_LINK_DAYS } from "@/lib/constants";
import { hashInviteToken } from "@/lib/invite-token";
import { createTeamSchema, messageSchema, uuidSchema } from "@/lib/validation/team";
import { isPast } from "@/lib/utils/date";
import type { AppSettings, TeamStatus } from "@/types/db";
import type { ActionState } from "./types";

export type InviteLinkState = ActionState & {
  url?: string;
  maxUses?: number;
  expiresAt?: string;
};

type LeaderMembership = {
  team_id: string;
  role: "leader" | "member";
  team: {
    id: string;
    max_members: number;
    status: TeamStatus;
    recruiting: boolean;
  } | null;
};

type FormationSettings = Pick<
  AppSettings,
  "team_creation_deadline" | "teams_locked"
>;

function back(path: string, kind: "error" | "ok", message?: string): never {
  const suffix =
    kind === "error"
      ? `error=${encodeURIComponent(message ?? "Thao tác không thành công.")}`
      : `ok=${encodeURIComponent(message ?? "1")}`;
  redirect(`${path}?${suffix}`);
}

function teamMutationMessage(
  error: { message?: string } | null,
  fallback: string,
) {
  const message = error?.message ?? "";

  if (message.includes("department is required")) {
    return "Cập nhật Ban và Mảng trong hồ sơ trước khi tham gia đội.";
  }

  if (message.includes("at most 3 developers")) {
    return "Đội đã đủ 3 thành viên Developer.";
  }

  if (message.includes("at most 2 Marcom")) {
    return "Đội đã đủ 2 thành viên Marcom/Operation.";
  }

  if (message.includes("not recruiting")) {
    return "Đội đang tạm dừng tuyển.";
  }

  if (message.includes("full team needs at least 1")) {
    return "Đội đủ người cần có ít nhất 1 thành viên Marcom/Operation.";
  }

  if (message.includes("Team size must be between 3 and 5")) {
    return "Đội phải có từ 3 đến 5 thành viên.";
  }

  return fallback;
}

export async function createTeamAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireUser();

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Kiểm tra lại thông tin đội.", fieldErrors };
  }

  const { data, error } = await supabase.rpc("create_team", {
    p_name: parsed.data.name,
    p_description: parsed.data.description || null,
    p_max_members: null,
  });

  if (error || !data) {
    return {
      ok: false,
      message: teamMutationMessage(
        error,
        "Không tạo được đội. Có thể bạn đã có đội, BTC đã khóa, hoặc đã quá deadline.",
      ),
    };
  }

  revalidatePath("/team");
  revalidatePath("/teams");
  revalidatePath("/participants");
  redirect("/team");
}

export async function requestJoinTeamAction(formData: FormData) {
  const { supabase } = await requireUser();

  const teamId = uuidSchema.safeParse(formData.get("team_id"));
  if (!teamId.success) back("/teams", "error", "Đội không hợp lệ.");

  const rawMessage = String(formData.get("message") ?? "");
  const message = messageSchema.safeParse(rawMessage);
  if (!message.success) back("/teams", "error", message.error.issues[0].message);

  const { error } = await supabase.rpc("request_join_team", {
    p_team_id: teamId.data,
    p_message: message.data || null,
  });

  if (error) {
    back(
      "/teams",
      "error",
      teamMutationMessage(
        error,
        "Không gửi được đơn. Có thể đội đã đủ, đã khóa, hoặc bạn đã có đội.",
      ),
    );
  }

  revalidatePath("/teams");
  revalidatePath("/team");
  back("/teams", "ok", "Đã gửi đơn xin vào đội.");
}

export async function approveJoinRequestAction(formData: FormData) {
  const { supabase } = await requireUser();

  const requestId = uuidSchema.safeParse(formData.get("request_id"));
  if (!requestId.success) back("/team", "error", "Đơn không hợp lệ.");

  const { error } = await supabase.rpc("approve_join_request", {
    p_request_id: requestId.data,
  });

  if (error) {
    back(
      "/team",
      "error",
      teamMutationMessage(
        error,
        "Không duyệt được đơn. Đội có thể đã đủ người.",
      ),
    );
  }

  revalidatePath("/team");
  revalidatePath("/teams");
  back("/team", "ok", "Thao tác đã hoàn tất.");
}

export async function rejectJoinRequestAction(formData: FormData) {
  const { supabase } = await requireUser();

  const requestId = uuidSchema.safeParse(formData.get("request_id"));
  if (!requestId.success) back("/team", "error", "Đơn không hợp lệ.");

  const { error } = await supabase.rpc("reject_join_request", {
    p_request_id: requestId.data,
  });

  if (error) back("/team", "error", "Không từ chối được đơn.");

  revalidatePath("/team");
  back("/team", "ok", "Thao tác đã hoàn tất.");
}

export async function leaveTeamAction(formData: FormData) {
  const { supabase } = await requireUser();

  const teamId = uuidSchema.safeParse(formData.get("team_id"));
  if (!teamId.success) back("/team", "error", "Đội không hợp lệ.");

  const { error } = await supabase.rpc("leave_team", {
    p_team_id: teamId.data,
  });

  if (error) {
    back("/team", "error", "Không rời đội được. Đội trưởng cần chuyển quyền trước.");
  }

  revalidatePath("/team");
  revalidatePath("/teams");
  revalidatePath("/participants");
  back("/team", "ok", "Thao tác đã hoàn tất.");
}

export async function transferLeadershipAction(formData: FormData) {
  const { supabase } = await requireUser();

  const teamId = uuidSchema.safeParse(formData.get("team_id"));
  const newLeaderId = uuidSchema.safeParse(formData.get("new_leader_id"));

  if (!teamId.success || !newLeaderId.success) {
    back("/team", "error", "Thành viên không hợp lệ.");
  }

  const { error } = await supabase.rpc("transfer_leadership", {
    p_team_id: teamId.data,
    p_new_leader_id: newLeaderId.data,
  });

  if (error) back("/team", "error", "Không chuyển được đội trưởng.");

  revalidatePath("/team");
  back("/team", "ok", "Thao tác đã hoàn tất.");
}

export async function inviteToTeamAction(formData: FormData) {
  const { supabase, profileId } = await requireUser();

  const inviteeId = uuidSchema.safeParse(formData.get("invitee_id"));
  if (!inviteeId.success) back("/participants", "error", "Thí sinh không hợp lệ.");

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", profileId)
    .limit(1)
    .returns<{ team_id: string; role: "leader" | "member" }[]>();

  const team = membership?.[0];
  if (!team || team.role !== "leader") {
    back("/participants", "error", "Chỉ đội trưởng mới có thể mời.");
  }

  const { error } = await supabase.rpc("invite_to_team", {
    p_team_id: team.team_id,
    p_invitee_id: inviteeId.data,
  });

  if (error) {
    back(
      "/participants",
      "error",
      teamMutationMessage(
        error,
        "Không mời được. Đội có thể đã đủ hoặc người này đã có đội.",
      ),
    );
  }

  revalidatePath("/participants");
  revalidatePath("/team");
  back("/participants", "ok", "Đã gửi lời mời.");
}

export async function createInviteLinkAction(
  _previous: InviteLinkState,
  formData: FormData,
): Promise<InviteLinkState> {
  const { supabase, profileId } = await requireUser();

  const teamId = uuidSchema.safeParse(formData.get("team_id"));
  if (!teamId.success) {
    return { ok: false, message: "Đội không hợp lệ." };
  }

  const [{ data: memberships }, { data: settingsRows }] = await Promise.all([
    supabase
      .from("team_members")
      .select("team_id, role, team:teams(id, max_members, status, recruiting)")
      .eq("user_id", profileId)
      .limit(1)
      .returns<LeaderMembership[]>(),
    supabase
      .from("app_settings")
      .select("team_creation_deadline, teams_locked")
      .eq("id", 1)
      .limit(1)
      .returns<FormationSettings[]>(),
  ]);

  const membership = memberships?.[0];
  const team = membership?.team;
  const settings = settingsRows?.[0];

  if (!membership || !team || membership.team_id !== teamId.data) {
    return { ok: false, message: "Bạn không thuộc đội này." };
  }

  if (membership.role !== "leader") {
    return { ok: false, message: "Chỉ đội trưởng mới tạo được link mời." };
  }

  if (team.status === "locked" || team.status === "archived") {
    return { ok: false, message: "Đội đã bị khóa." };
  }

  if (!team.recruiting) {
    return { ok: false, message: "Đội đang tạm dừng tuyển." };
  }

  if (settings?.teams_locked) {
    return { ok: false, message: "BTC đã khóa thao tác đội." };
  }

  if (isPast(settings?.team_creation_deadline)) {
    return { ok: false, message: "Đã quá deadline chốt đội." };
  }

  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);

  const remainingSlots = Math.max(0, team.max_members - (count ?? 0));
  if (remainingSlots < 1) {
    return { ok: false, message: "Đội đã đủ người." };
  }

  // One link covers the remaining slots; it is never wider than the team.
  const maxUses = Math.min(20, remainingSlots);
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashInviteToken(token);

  const { error } = await supabase.rpc("create_invite_link", {
    p_team_id: team.id,
    p_token_hash: tokenHash,
    p_max_uses: maxUses,
    p_expires_days: INVITE_LINK_DAYS,
  });

  if (error) {
    return {
      ok: false,
      message: "Không tạo được link mời. Thử lại sau.",
    };
  }

  return {
    ok: true,
    message: "Đã tạo link mời.",
    url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/join/${token}`,
    maxUses,
    expiresAt: new Date(
      Date.now() + INVITE_LINK_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString(),
  };
}

export async function joinWithLinkAction(formData: FormData) {
  const { supabase } = await requireUser();

  const token = String(formData.get("token") ?? "");
  if (!/^[0-9a-f]{64}$/i.test(token)) {
    back("/join", "error", "Link không hợp lệ.");
  }

  const { error } = await supabase.rpc("join_team_with_link", {
    p_token_hash: hashInviteToken(token),
  });

  if (error) {
    redirect(`/join/${token}?error=1`);
  }

  revalidatePath("/team");
  revalidatePath("/teams");
  revalidatePath("/participants");
  redirect("/team?joined=1");
}

export async function respondToInviteAction(formData: FormData) {
  const { supabase } = await requireUser();

  const inviteId = uuidSchema.safeParse(formData.get("invite_id"));
  const accept = formData.get("accept") === "true";

  if (!inviteId.success) {
    back("/team", "error", "Lời mời không hợp lệ.");
  }

  const { error } = await supabase.rpc("respond_to_invite", {
    p_invite_id: inviteId.data,
    p_accept: accept,
  });

  if (error) {
    back(
      "/team",
      "error",
      accept
        ? teamMutationMessage(
            error,
            "Không tham gia được. Đội có thể đã đủ, lời mời hết hạn, hoặc bạn đã có đội.",
          )
        : "Không từ chối được lời mời.",
    );
  }

  revalidatePath("/team");
  revalidatePath("/teams");
  revalidatePath("/participants");
  back("/team", "ok", "Thao tác đã hoàn tất.");
}

export async function cancelInviteAction(formData: FormData) {
  const { supabase } = await requireUser();
  const inviteId = uuidSchema.safeParse(formData.get("invite_id"));

  if (!inviteId.success) {
    back("/team", "error", "Lời mời không hợp lệ.");
  }

  const { error } = await supabase.rpc("cancel_team_invite", {
    p_invite_id: inviteId.data,
  });

  if (error) {
    back("/team", "error", "Không hủy được lời mời. Có thể lời mời đã được xử lý.");
  }

  revalidatePath("/team");
  revalidatePath("/participants");
  back("/team", "ok", "Thao tác đã hoàn tất.");
}

export async function cancelJoinRequestAction(formData: FormData) {
  const { supabase } = await requireUser();
  const requestId = uuidSchema.safeParse(formData.get("request_id"));

  if (!requestId.success) {
    back("/teams", "error", "Đơn xin vào đội không hợp lệ.");
  }

  const { error } = await supabase.rpc("cancel_join_request", {
    p_request_id: requestId.data,
  });

  if (error) {
    back("/teams", "error", "Không hủy được đơn. Có thể đơn đã được xử lý.");
  }

  revalidatePath("/teams");
  revalidatePath("/team");
  back("/teams", "ok", "Đã hủy đơn xin vào đội.");
}

export async function setRecruitingAction(formData: FormData) {
  const { supabase } = await requireUser();
  const teamId = uuidSchema.safeParse(formData.get("team_id"));
  const recruiting = formData.get("recruiting") === "true";

  if (!teamId.success) {
    back("/team", "error", "Đội không hợp lệ.");
  }

  const { error } = await supabase.rpc("set_team_recruiting", {
    p_team_id: teamId.data,
    p_recruiting: recruiting,
  });

  if (error) {
    back(
      "/team",
      "error",
      teamMutationMessage(error, "Không đổi được trạng thái tuyển."),
    );
  }

  revalidatePath("/team");
  revalidatePath("/teams");
  revalidatePath("/admin");
  back("/team", "ok", recruiting ? "Đã mở tuyển." : "Đã tạm dừng tuyển.");
}
