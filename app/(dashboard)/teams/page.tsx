import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Search,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import {
  cancelJoinRequestAction,
  requestJoinTeamAction,
  respondToInviteAction,
} from "@/lib/actions/team";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlashToast } from "@/components/flash-toast";
import { formatDateTime } from "@/lib/utils/date";
import type { Profile, TeamStatus } from "@/types/db";


type TeamRow = {
  id: string;
  name: string;
  description: string | null;
  status: TeamStatus;
  recruiting: boolean;
  max_members: number;
  leader_id: string;
  created_at: string;
  leader: Pick<
    Profile,
    "id" | "full_name" | "email" | "avatar_url" | "major" | "cohort"
  > | null;
  team_members: { user_id: string }[];
};

type Membership = { team_id: string; role: "leader" | "member" };

type MyRequest = {
  id: string;
  team_id: string;
  status: string;
  created_at: string;
  decided_at: string | null;
  team: { id: string; name: string } | null;
};

type PendingInvite = {
  id: string;
  team_id: string;
  inviter_id: string;
  message: string | null;
  created_at: string;
  team: {
    id: string;
    name: string;
    max_members: number;
    status: TeamStatus;
    recruiting: boolean;
  } | null;
  inviter: { full_name: string; avatar_url: string | null } | null;
};

const requestStatusMeta: Record<
  string,
  { label: string; tone: "warning" | "success" | "error" | "neutral" }
> = {
  pending: { label: "Chờ duyệt", tone: "warning" },
  accepted: { label: "Đã duyệt", tone: "success" },
  rejected: { label: "Bị từ chối", tone: "error" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
};

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { supabase, profileId } = await requireUser();
  const params = await searchParams;

  const [
    { data: teams },
    { data: memberships },
    { data: myRequests },
    { data: ownProfiles },
    { data: pendingInvites },
  ] = await Promise.all([
      supabase
        .from("teams")
        .select(
          "id, name, description, status, recruiting, max_members, leader_id, created_at, leader:profiles!teams_leader_id_fkey(id, full_name, email, avatar_url, major, cohort), team_members(user_id)",
        )
        .eq("status", "open")
        .eq("recruiting", true)
        .order("created_at", { ascending: false })
        .limit(50)
        .returns<TeamRow[]>(),
      supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", profileId)
        .limit(1)
        .returns<Membership[]>(),
      supabase
        .from("team_join_requests")
        .select("id, team_id, status, created_at, decided_at, team:teams(id, name)")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<MyRequest[]>(),
      supabase
        .from("profiles")
        .select("department, subteam")
        .eq("id", profileId)
        .limit(1)
        .returns<Pick<Profile, "department" | "subteam">[]>(),
      supabase
        .from("team_invites")
        .select(
          "id, team_id, inviter_id, message, created_at, team:teams(id, name, max_members, status, recruiting), inviter:profiles!team_invites_inviter_id_fkey(full_name, avatar_url)",
        )
        .eq("invitee_id", profileId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .returns<PendingInvite[]>(),
    ]);

  const membership = memberships?.[0];
  const ownProfile = ownProfiles?.[0];
  const profileReady = Boolean(ownProfile?.department && ownProfile?.subteam);
  const pendingTeamIds = new Set(
    (myRequests ?? [])
      .filter((request) => request.status === "pending")
      .map((request) => request.team_id),
  );
  const pendingRequestByTeam = new Map(
    (myRequests ?? [])
      .filter((request) => request.status === "pending")
      .map((request) => [request.team_id, request.id]),
  );

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header>
        <p className="text-sm font-medium text-primary">Ghép đội</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
          Tìm đội đang tuyển
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
          Gửi đơn kèm lời nhắn. Đội trưởng sẽ duyệt hoặc từ chối. Bạn chỉ có thể
          ở trong một đội. Đội gồm 3–5 người, tối đa 3 Developer và 2
          Marcom/Operation.
        </p>
      </header>

      {!profileReady ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-warning-container p-4 text-sm text-on-warning-container">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Cập nhật Ban và Mảng trong hồ sơ trước khi gửi đơn xin vào đội.
          </span>
          <Link
            href="/profile"
            className="ml-auto font-medium underline underline-offset-2"
          >
            Cập nhật hồ sơ
          </Link>
        </div>
      ) : null}

      {!membership && pendingInvites && pendingInvites.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-base font-medium text-on-surface">
            Lời mời vào đội
          </h2>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">
            Chấp nhận một lời mời để vào đội. Bạn chỉ có thể ở một đội.
          </p>
          <ul className="mt-3 space-y-4">
            {pendingInvites.map((invite) => {
              const open =
                invite.team?.status === "open" && invite.team.recruiting;
              return (
                <li
                  key={invite.id}
                  className="rounded-xl border border-outline-variant p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={invite.inviter?.avatar_url}
                      name={invite.inviter?.full_name}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-on-surface">
                          {invite.team?.name ?? "Đội"}
                        </p>
                        {!open ? (
                          <Badge tone="warning">Đội đã đủ hoặc tạm dừng</Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        Mời bởi {invite.inviter?.full_name ?? "đội trưởng"} ·{" "}
                        {formatDateTime(invite.created_at)}
                      </p>
                      {invite.message ? (
                        <p className="mt-2 rounded-lg bg-surface-container px-3 py-2 text-sm leading-6 text-on-surface-variant">
                          {invite.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={respondToInviteAction}>
                      <input type="hidden" name="invite_id" value={invite.id} />
                      <input type="hidden" name="accept" value="true" />
                      <SubmitButton
                        size="sm"
                        disabled={!open || !profileReady}
                        pendingText="Đang tham gia…"
                      >
                        Chấp nhận
                      </SubmitButton>
                    </form>
                    <form action={respondToInviteAction}>
                      <input type="hidden" name="invite_id" value={invite.id} />
                      <input type="hidden" name="accept" value="false" />
                      <SubmitButton
                        size="sm"
                        variant="outline"
                        pendingText="Đang từ chối…"
                      >
                        Từ chối
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {params.ok ? (
        <div className="flex items-center gap-2 rounded-xl bg-success-container p-4 text-sm text-on-success-container">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {params.ok === "1" ? "Thao tác thành công." : params.ok}
        </div>
      ) : null}
      {params.error ? (
        <div className="flex gap-2 rounded-xl bg-error-container p-4 text-sm text-on-error-container">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {params.error}
        </div>
      ) : null}

      {myRequests && myRequests.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-base font-medium text-on-surface">
            Đơn xin vào đội
          </h2>
          <ul className="mt-3 divide-y divide-outline-variant">
            {myRequests.map((request) => {
              const meta = requestStatusMeta[request.status] ?? {
                label: request.status,
                tone: "neutral" as const,
              };
              return (
                <li
                  key={request.id}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-on-surface">
                      {request.team?.name ?? "Đội"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Gửi {formatDateTime(request.created_at)}
                      {request.decided_at
                        ? ` · Xử lý ${formatDateTime(request.decided_at)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {request.status === "pending" ? (
                      <form action={cancelJoinRequestAction}>
                        <input
                          type="hidden"
                          name="request_id"
                          value={request.id}
                        />
                        <SubmitButton
                          size="sm"
                          variant="outline"
                          pendingText="Đang hủy…"
                        >
                          Hủy đơn
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {membership ? (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <p className="text-sm text-on-surface">
              Bạn đã ở trong một đội. Quản lý đội trước khi tìm đội khác.
            </p>
          </div>
          <Link href="/team" className={buttonClass({ size: "sm" })}>
            Đội của tôi
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      ) : null}

      {teams && teams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => {
            const count = team.team_members?.length ?? 0;
            const isPending = pendingTeamIds.has(team.id);
            const isFull = count >= team.max_members;

            return (
              <Card
                key={team.id}
                className="flex flex-col p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-medium text-on-surface">
                      {team.name}
                    </h2>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Thành lập {formatDateTime(team.created_at)}
                    </p>
                  </div>
                  <Badge tone={isFull ? "success" : "primary"}>
                    {count}/{team.max_members}
                  </Badge>
                </div>

                <p className="mt-3 line-clamp-3 min-h-16 text-sm leading-6 text-on-surface-variant">
                  {team.description || "Đội chưa có mô tả."}
                </p>

                <div className="mt-4 flex items-center gap-2 border-t border-outline-variant pt-4">
                  <Avatar
                    src={team.leader?.avatar_url}
                    name={team.leader?.full_name}
                    size={32}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-on-surface">
                      {team.leader?.full_name ?? "Đội trưởng"}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {[team.leader?.major, team.leader?.cohort]
                        .filter(Boolean)
                        .join(" · ") || "Đội trưởng"}
                    </p>
                    {team.leader?.email ? (
                      <p className="truncate text-xs text-on-surface-variant">
                        {team.leader.email}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4">
                  {membership ? (
                    <p className="rounded-xl bg-surface-container px-3 py-2 text-xs leading-5 text-on-surface-variant">
                      Bạn đã ở trong một đội. Vào{" "}
                      <Link href="/team" className="font-medium text-primary">
                        Đội của tôi
                      </Link>{" "}
                      để quản lý.
                    </p>
                  ) : isPending ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-xl bg-warning-container px-3 py-2 text-xs text-on-warning-container">
                        <Search className="h-3.5 w-3.5" aria-hidden />
                        Đơn đang chờ đội trưởng duyệt
                      </div>
                      {pendingRequestByTeam.get(team.id) ? (
                        <form action={cancelJoinRequestAction}>
                          <input
                            type="hidden"
                            name="request_id"
                            value={pendingRequestByTeam.get(team.id)}
                          />
                          <SubmitButton
                            size="sm"
                            variant="outline"
                            pendingText="Đang hủy…"
                          >
                            Hủy đơn
                          </SubmitButton>
                        </form>
                      ) : null}
                    </div>
                  ) : isFull ? (
                    <p className="rounded-xl bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
                      Đội đã đủ {team.max_members} người. Không thể gửi thêm đơn.
                    </p>
                  ) : !profileReady ? (
                    <p className="rounded-xl bg-surface-container px-3 py-2 text-xs leading-5 text-on-surface-variant">
                      Cập nhật Ban và Mảng trong{" "}
                      <Link href="/profile" className="font-medium text-primary">
                        hồ sơ
                      </Link>{" "}
                      trước khi gửi đơn.
                    </p>
                  ) : (
                    <form action={requestJoinTeamAction} className="space-y-2">
                      <input type="hidden" name="team_id" value={team.id} />
                      <Input
                        name="message"
                        maxLength={300}
                        placeholder="Lời nhắn ngắn cho đội trưởng…"
                        aria-label="Lời nhắn"
                        disabled={isFull}
                      />
                      <SubmitButton
                        className="w-full"
                        size="sm"
                        disabled={isFull}
                        pendingText="Đang gửi…"
                      >
                        Xin vào đội
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="h-5 w-5" aria-hidden />}
          title="Chưa có đội nào đang tuyển"
          description="Bạn có thể tạo đội mới và mời đồng đội."
          action={
            <Link href="/team" className={buttonClass({ size: "sm" })}>
              Tạo đội
            </Link>
          }
        />
      )}
    </div>
  );
}
