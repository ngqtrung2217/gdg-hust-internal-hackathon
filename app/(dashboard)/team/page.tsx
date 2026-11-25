import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  LogOut,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import {
  approveJoinRequestAction,
  cancelInviteAction,
  leaveTeamAction,
  rejectJoinRequestAction,
  respondToInviteAction,
} from "@/lib/actions/team";
import { CreateTeamForm } from "@/components/create-team-form";
import { InviteLinkCard } from "@/components/invite-link-card";
import { TransferLeadershipForm } from "@/components/transfer-leadership-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlashToast } from "@/components/flash-toast";
import { TEAM_STATUS_LABEL } from "@/lib/constants";
import { deadlineLabel, formatDateTime, isPast } from "@/lib/utils/date";
import type {
  AppSettings,
  JoinRequest,
  TeamInvite,
  TeamMember,
  TeamStatus,
} from "@/types/db";


type Membership = {
  team_id: string;
  role: "leader" | "member";
  team: {
    id: string;
    name: string;
    description: string | null;
    leader_id: string;
    max_members: number;
    status: TeamStatus;
    created_at: string;
  } | null;
};

const inviteStatusMeta: Record<
  string,
  { label: string; tone: "warning" | "success" | "error" | "neutral" }
> = {
  pending: { label: "Chờ phản hồi", tone: "warning" },
  accepted: { label: "Đã nhận", tone: "success" },
  declined: { label: "Bị từ chối", tone: "error" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
  expired: { label: "Hết hạn", tone: "neutral" },
};

type PendingInvite = {
  id: string;
  team_id: string;
  inviter_id: string;
  message: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  team: { id: string; name: string; max_members: number; status: TeamStatus } | null;
  inviter: { full_name: string; avatar_url: string | null } | null;
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { supabase, profileId } = await requireUser();
  const params = await searchParams;

  const [{ data: memberships }, { data: settingsRows }, { data: pendingInvites }] =
    await Promise.all([
      supabase
        .from("team_members")
        .select(
          "team_id, role, team:teams(id, name, description, leader_id, max_members, status, created_at)",
        )
        .eq("user_id", profileId)
        .limit(1)
        .returns<Membership[]>(),
      supabase
        .from("app_settings")
        .select("allowlist_mode, max_team_size, team_creation_deadline, teams_locked")
        .eq("id", 1)
        .limit(1)
        .returns<AppSettings[]>(),
      supabase
        .from("team_invites")
        .select(
          "id, team_id, inviter_id, message, status, created_at, expires_at, team:teams(id, name, max_members, status), inviter:profiles!team_invites_inviter_id_fkey(full_name, avatar_url)",
        )
        .eq("invitee_id", profileId)
        .eq("status", "pending")
        .returns<PendingInvite[]>(),
    ]);

  const membership = memberships?.[0];
  const team = membership?.team;
  const settings = settingsRows?.[0];

  const deadlinePassed = isPast(settings?.team_creation_deadline);
  const teamLocked = Boolean(settings?.teams_locked || deadlinePassed);

  if (!team) {
    return (
      <div className="space-y-6">
        <FlashToast ok={params.ok} error={params.error} />

        <header>
          <p className="text-sm font-medium text-primary">Đội của tôi</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
            Bạn chưa có đội
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Tạo đội mới để trở thành đội trưởng, hoặc tìm một đội đang tuyển.
            Mỗi người chỉ thuộc một đội.
          </p>
        </header>

        {params.ok ? (
          <div className="flex items-center gap-2 rounded-xl bg-success-container p-4 text-sm text-on-success-container">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Thao tác đã hoàn tất.
          </div>
        ) : null}
        {params.error ? (
          <div className="flex gap-2 rounded-xl bg-error-container p-4 text-sm text-on-error-container">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {params.error}
          </div>
        ) : null}

        {pendingInvites && pendingInvites.length > 0 ? (
          <Card className="p-6">
            <h2 className="text-lg font-medium text-on-surface">
              Lời mời vào đội
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Chấp nhận một lời mời để vào đội. Bạn chỉ có thể ở một đội.
            </p>
            <ul className="mt-4 space-y-3">
              {pendingInvites.map((invite) => {
                const openTeam = invite.team?.status === "open";
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
                          {!openTeam ? (
                            <Badge tone="warning">Đội đã đủ</Badge>
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
                        <input
                          type="hidden"
                          name="invite_id"
                          value={invite.id}
                        />
                        <input type="hidden" name="accept" value="true" />
                        <SubmitButton
                          size="sm"
                          disabled={!openTeam}
                          pendingText="Đang tham gia…"
                        >
                          Chấp nhận
                        </SubmitButton>
                      </form>
                      <form action={respondToInviteAction}>
                        <input
                          type="hidden"
                          name="invite_id"
                          value={invite.id}
                        />
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

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <CreateTeamForm
            maxAllowed={settings?.max_team_size ?? 5}
            disabled={teamLocked}
            disabledReason={
              settings?.teams_locked
                ? "BTC đã khóa toàn bộ thao tác đội."
                : "Đã quá deadline tạo đội."
            }
          />

          <aside className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-on-surface">
                <Clock className="h-4 w-4 text-on-surface-variant" aria-hidden />
                Deadline chốt đội
              </div>
              <p className="mt-2 text-lg font-medium text-on-surface">
                {deadlineLabel(settings?.team_creation_deadline)}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {formatDateTime(settings?.team_creation_deadline)}
              </p>
            </Card>

            <Card className="p-5">
              <h2 className="text-base font-medium text-on-surface">
                Chưa muốn làm đội trưởng?
              </h2>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Duyệt danh sách đội đang tuyển và gửi đơn xin vào.
              </p>
              <Link
                href="/teams"
                className={buttonClass({
                  variant: "outline",
                  size: "sm",
                  className: "mt-4",
                })}
              >
                Tìm đội
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Card>
          </aside>
        </div>
      </div>
    );
  }

  const isLeader = membership?.role === "leader";

  const [{ data: members }, { data: requests }, { data: invites }] =
    await Promise.all([
      supabase
        .from("team_members")
        .select(
          "team_id, user_id, role, joined_at, profile:profiles(id, full_name, email, avatar_url, major, cohort, headline)",
        )
        .eq("team_id", team.id)
        .order("joined_at", { ascending: true })
        .returns<TeamMember[]>(),
      isLeader
        ? supabase
            .from("team_join_requests")
            .select(
              "id, team_id, user_id, message, status, created_at, profile:profiles!team_join_requests_user_id_fkey(id, full_name, email, avatar_url, major, cohort, headline)",
            )
            .eq("team_id", team.id)
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .returns<JoinRequest[]>()
        : Promise.resolve({ data: [] as JoinRequest[] }),
      isLeader
        ? supabase
            .from("team_invites")
            .select(
              "id, team_id, inviter_id, invitee_id, status, created_at, invitee:profiles!team_invites_invitee_id_fkey(id, full_name, email, avatar_url)",
            )
            .eq("team_id", team.id)
            .order("created_at", { ascending: false })
            .limit(20)
            .returns<TeamInvite[]>()
        : Promise.resolve({ data: [] as TeamInvite[] }),
    ]);

  const roster = members ?? [];
  const memberCount = roster.length;
  const leader = roster.find((member) => member.role === "leader")?.profile;

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Đội của tôi</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
            {team.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            {team.description || "Đội chưa có mô tả."}
          </p>
        </div>
        <Badge tone={team.status === "full" ? "success" : "primary"}>
          {TEAM_STATUS_LABEL[team.status]} · {memberCount}/{team.max_members}
        </Badge>
      </header>

      {params.ok ? (
        <div className="flex items-center gap-2 rounded-xl bg-success-container p-4 text-sm text-on-success-container">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Thao tác đã hoàn tất.
        </div>
      ) : null}
      {params.error ? (
        <div className="flex gap-2 rounded-xl bg-error-container p-4 text-sm text-on-error-container">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {params.error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-on-surface-variant" aria-hidden />
              <h2 className="text-lg font-medium text-on-surface">
                Thành viên
              </h2>
            </div>

            <ul className="mt-4 divide-y divide-outline-variant">
              {roster.map((member) => (
                <li
                  key={member.user_id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar
                    src={member.profile?.avatar_url}
                    name={member.profile?.full_name}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-on-surface">
                        {member.profile?.full_name ?? "Thành viên"}
                      </span>
                      {member.role === "leader" ? (
                        <Badge tone="primary">
                          <ShieldCheck className="h-3 w-3" aria-hidden />
                          Đội trưởng
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                      {member.profile?.email ?? "Không có email"}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {[member.profile?.major, member.profile?.cohort]
                        .filter(Boolean)
                        .join(" · ") || "Chưa cập nhật ngành/khóa"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {isLeader ? (
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-on-surface-variant" aria-hidden />
                <h2 className="text-lg font-medium text-on-surface">
                  Đơn xin vào đội
                </h2>
              </div>

              {requests && requests.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {requests.map((request) => (
                    <li
                      key={request.id}
                      className="rounded-xl border border-outline-variant p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={request.profile?.avatar_url}
                          name={request.profile?.full_name}
                          size={36}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-on-surface">
                            {request.profile?.full_name ?? "Thí sinh"}
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">
                            {request.profile?.email ?? "Không có email"}
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-variant">
                            {[request.profile?.major, request.profile?.cohort]
                              .filter(Boolean)
                              .join(" · ") || "Chưa cập nhật ngành/khóa"}
                          </p>
                          {request.message ? (
                            <p className="mt-2 rounded-lg bg-surface-container px-3 py-2 text-sm leading-6 text-on-surface-variant">
                              {request.message}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <form action={approveJoinRequestAction}>
                          <input
                            type="hidden"
                            name="request_id"
                            value={request.id}
                          />
                          <SubmitButton
                            size="sm"
                            pendingText="Đang duyệt…"
                          >
                            Duyệt
                          </SubmitButton>
                        </form>
                        <form action={rejectJoinRequestAction}>
                          <input
                            type="hidden"
                            name="request_id"
                            value={request.id}
                          />
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
                  ))}
                </ul>
              ) : (
                <EmptyState
                  className="mt-4"
                  icon={<Users className="h-5 w-5" aria-hidden />}
                  title="Chưa có đơn nào"
                  description="Khi có thí sinh xin vào đội, đơn sẽ xuất hiện ở đây."
                />
              )}
            </Card>
          ) : null}

          {isLeader ? (
            <Card className="p-6">
              <h2 className="text-lg font-medium text-on-surface">
                Lời mời đã gửi
              </h2>
              {invites && invites.length > 0 ? (
                <ul className="mt-4 divide-y divide-outline-variant">
                  {invites.map((invite) => {
                    const meta = inviteStatusMeta[invite.status] ?? {
                      label: invite.status,
                      tone: "neutral" as const,
                    };
                    return (
                      <li
                        key={invite.id}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <Avatar
                          src={invite.invitee?.avatar_url}
                          name={invite.invitee?.full_name}
                          size={36}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-on-surface">
                            {invite.invitee?.full_name ?? "Thí sinh"}
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">
                            {invite.invitee?.email ?? "Không có email"}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            Đã gửi {formatDateTime(invite.created_at)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          {invite.status === "pending" ? (
                            <form action={cancelInviteAction}>
                              <input
                                type="hidden"
                                name="invite_id"
                                value={invite.id}
                              />
                              <SubmitButton
                                size="sm"
                                variant="outline"
                                pendingText="Đang hủy…"
                              >
                                Hủy mời
                              </SubmitButton>
                            </form>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-on-surface-variant">
                  Chưa gửi lời mời nào.
                </p>
              )}
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          {isLeader ? (
            <InviteLinkCard
              teamId={team.id}
              remainingSlots={Math.max(0, team.max_members - memberCount)}
            />
          ) : null}

          <Card className="p-5">
            <h2 className="text-base font-medium text-on-surface">Thông tin</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Đội trưởng</dt>
                <dd className="text-right font-medium text-on-surface">
                  {leader?.full_name ?? "Chưa xác định"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Thành viên</dt>
                <dd className="font-mono tabular-nums text-on-surface">
                  {memberCount}/{team.max_members}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Thành lập</dt>
                <dd className="text-right text-on-surface">
                  {formatDateTime(team.created_at)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Trạng thái</dt>
                <dd className="text-right text-on-surface">
                  {TEAM_STATUS_LABEL[team.status]}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-medium text-on-surface">Quản lý</h2>

            {isLeader && memberCount > 1 ? (
              <section className="mt-4 border-b border-outline-variant pb-4">
                <h3 className="text-sm font-medium text-on-surface">
                  Chuyển quyền đội trưởng
                </h3>
                <div className="mt-3">
                  <TransferLeadershipForm
                    teamId={team.id}
                    members={roster
                      .filter((member) => member.role !== "leader")
                      .map((member) => ({
                        id: member.user_id,
                        name: member.profile?.full_name ?? "Thành viên",
                      }))}
                  />
                </div>
              </section>
            ) : null}

            <form action={leaveTeamAction} className="mt-4">
              <input type="hidden" name="team_id" value={team.id} />
              {isLeader && memberCount > 1 ? (
                <p className="mb-2 text-xs leading-5 text-on-surface-variant">
                  Bạn cần chuyển quyền đội trưởng trước khi rời đội.
                </p>
              ) : (
                <p className="mb-2 text-xs leading-5 text-on-surface-variant">
                  {isLeader
                    ? "Đội chỉ còn bạn. Rời đội sẽ xóa đội này."
                    : "Bạn có thể rời đội và tham gia đội khác."}
                </p>
              )}
              <ConfirmSubmitButton
                variant="ghost"
                size="sm"
                className="w-full text-error hover:bg-error-container hover:text-on-error-container"
                confirmText={
                  isLeader
                    ? "Rời đội sẽ xóa đội này. Bạn có chắc không?"
                    : "Bạn có chắc muốn rời đội?"
                }
                pendingText="Đang rời đội…"
                disabled={isLeader && memberCount > 1}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Rời đội
              </ConfirmSubmitButton>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}
