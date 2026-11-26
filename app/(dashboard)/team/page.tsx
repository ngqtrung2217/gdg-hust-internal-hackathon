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
  setRecruitingAction,
} from "@/lib/actions/team";
import { CreateTeamForm } from "@/components/create-team-form";
import { InviteLinkCard } from "@/components/invite-link-card";
import { TransferLeadershipForm } from "@/components/transfer-leadership-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlashToast } from "@/components/flash-toast";
import {
  DEPARTMENT_OPTIONS,
  MAX_DEVELOPERS_PER_TEAM,
  MAX_MARCOM_OPERATION_PER_TEAM,
  MAX_PENDING_INVITES,
} from "@/lib/constants";
import { deadlineLabel, formatDateTime, isPast } from "@/lib/utils/date";
import type {
  AppSettings,
  JoinRequest,
  Profile,
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
    recruiting: boolean;
    code: string;
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

function recruitingState(team: { status: TeamStatus; recruiting: boolean }) {
  if (team.status === "full") return { label: "Đã đủ", tone: "success" as const };
  if (team.status === "locked") return { label: "Đã khóa", tone: "error" as const };
  if (team.status === "archived") return { label: "Lưu trữ", tone: "neutral" as const };
  return team.recruiting
    ? { label: "Đang tuyển", tone: "primary" as const }
    : { label: "Tạm dừng tuyển", tone: "warning" as const };
}

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

  const [
    { data: memberships },
    { data: settingsRows },
    { data: pendingInvites },
    { data: ownProfiles },
  ] = await Promise.all([
      supabase
        .from("team_members")
        .select(
          "team_id, role, team:teams(id, name, description, leader_id, max_members, status, recruiting, code, created_at)",
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
      supabase
        .from("profiles")
        .select("department, subteam")
        .eq("id", profileId)
        .limit(1)
        .returns<Pick<Profile, "department" | "subteam">[]>(),
    ]);

  const membership = memberships?.[0];
  const team = membership?.team;
  const ownProfile = ownProfiles?.[0];
  const profileReady = Boolean(ownProfile?.department && ownProfile?.subteam);
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
        </header>

        {!profileReady ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-warning-container p-4 text-sm text-on-warning-container">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>Cập nhật Ban và Mảng trong hồ sơ trước khi tạo đội.</span>
            <Link
              href="/profile"
              className="ml-auto font-medium underline underline-offset-2"
            >
              Cập nhật hồ sơ
            </Link>
          </div>
        ) : null}

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
            disabled={teamLocked || !profileReady}
            disabledReason={
              !profileReady
                ? "Cập nhật Ban và Mảng trong hồ sơ trước khi tạo đội."
                : settings?.teams_locked
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
                Tìm đội đang tuyển
              </h2>
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
          "team_id, user_id, role, joined_at, profile:profiles(id, full_name, email, avatar_url, major, cohort, headline, department, subteam)",
        )
        .eq("team_id", team.id)
        .order("joined_at", { ascending: true })
        .returns<TeamMember[]>(),
      isLeader
        ? supabase
            .from("team_join_requests")
            .select(
              "id, team_id, user_id, message, status, created_at, profile:profiles!team_join_requests_user_id_fkey(id, full_name, email, avatar_url, major, cohort, headline, department, subteam)",
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
              "id, team_id, inviter_id, invitee_id, status, created_at, expires_at, invitee:profiles!team_invites_invitee_id_fkey(id, full_name, email, avatar_url)",
            )
            .eq("team_id", team.id)
            .order("created_at", { ascending: false })
            .limit(20)
            .returns<TeamInvite[]>()
        : Promise.resolve({ data: [] as TeamInvite[] }),
    ]);

  const roster = members ?? [];
  const activePendingInvites = (invites ?? []).filter(
    (invite) => invite.status === "pending" && !isPast(invite.expires_at),
  ).length;
  const memberCount = roster.length;
  const leader = roster.find((member) => member.role === "leader")?.profile;
  const developerCount = roster.filter(
    (member) => member.profile?.department === "developer",
  ).length;
  const marcomOperationCount = roster.filter(
    (member) =>
      member.profile?.department === "marcom" ||
      member.profile?.department === "operation",
  ).length;

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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-on-surface-variant">Mã đội</span>
            <span className="rounded-lg bg-surface-container px-2 py-1 font-mono text-sm tracking-widest text-on-surface">
              {team.code}
            </span>
            <CopyButton value={team.code} label="Sao chép mã" />
          </div>
        </div>
        <Badge tone={recruitingState(team).tone}>
          {recruitingState(team).label} · {memberCount}/{team.max_members}
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
            <div className="flex flex-wrap items-center gap-2">
              <Users className="h-5 w-5 text-on-surface-variant" aria-hidden />
              <h2 className="text-lg font-medium text-on-surface">
                Thành viên
              </h2>
              <div className="ml-auto flex flex-wrap gap-2">
                <Badge
                  tone={
                    developerCount >= MAX_DEVELOPERS_PER_TEAM
                      ? "warning"
                      : "neutral"
                  }
                >
                  {developerCount}/{MAX_DEVELOPERS_PER_TEAM} Dev
                </Badge>
                <Badge
                  tone={
                    marcomOperationCount >= MAX_MARCOM_OPERATION_PER_TEAM
                      ? "warning"
                      : "neutral"
                  }
                >
                  {marcomOperationCount}/{MAX_MARCOM_OPERATION_PER_TEAM}{" "}
                  Marcom/Operation
                </Badge>
              </div>
            </div>
            <p className="mt-2 text-xs leading-5 text-on-surface-variant">
              Đội gồm 3–5 người, tối đa {MAX_DEVELOPERS_PER_TEAM} Developer và{" "}
              {MAX_MARCOM_OPERATION_PER_TEAM} Marcom/Operation.
            </p>

            <ul className="mt-4 divide-y divide-outline-variant">
              {roster.map((member) => {
                const department = DEPARTMENT_OPTIONS.find(
                  (option) => option.value === member.profile?.department,
                );
                const area = department?.areas.find(
                  (item) => item.value === member.profile?.subteam,
                );

                return (
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
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {department ? (
                          <Badge tone="neutral">{department.label}</Badge>
                        ) : (
                          <Badge tone="warning">Chưa chọn ban</Badge>
                        )}
                        {area ? <Badge tone="neutral">{area.label}</Badge> : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-on-surface-variant">
                        {[member.profile?.major, member.profile?.cohort]
                          .filter(Boolean)
                          .join(" · ") || "Chưa cập nhật ngành/khóa"}
                      </p>
                    </div>
                  </li>
                );
              })}
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
                  {requests.map((request) => {
                    const department = DEPARTMENT_OPTIONS.find(
                      (option) => option.value === request.profile?.department,
                    );
                    const area = department?.areas.find(
                      (item) => item.value === request.profile?.subteam,
                    );

                    return (
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
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {department ? (
                                <Badge tone="neutral">
                                  {department.label}
                                </Badge>
                              ) : (
                                <Badge tone="warning">Chưa chọn ban</Badge>
                              )}
                              {area ? (
                                <Badge tone="neutral">{area.label}</Badge>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-on-surface-variant">
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
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  className="mt-4"
                  icon={<Users className="h-5 w-5" aria-hidden />}
                  title="Chưa có đơn nào"
                />
              )}
            </Card>
          ) : null}

          {isLeader ? (
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-medium text-on-surface">
                  Lời mời đã gửi
                </h2>
                <Badge
                  tone={
                    activePendingInvites >= MAX_PENDING_INVITES
                      ? "warning"
                      : "neutral"
                  }
                >
                  {activePendingInvites}/{MAX_PENDING_INVITES} đang chờ
                </Badge>
              </div>
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
              recruiting={team.recruiting}
            />
          ) : null}

          <Card className="p-5">
            <h2 className="text-base font-medium text-on-surface">Thông tin</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Đội trưởng</dt>
                <dd className="text-right font-medium text-on-surface">
                  {leader?.full_name ?? "Chưa xác định"}
                  {leader?.email ? (
                    <span className="block text-xs font-normal text-on-surface-variant">
                      {leader.email}
                    </span>
                  ) : null}
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
                  {recruitingState(team).label}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-medium text-on-surface">Quản lý</h2>

            {isLeader && team.status !== "locked" && team.status !== "archived" ? (
              <form action={setRecruitingAction} className="mt-3 space-y-2 rounded-xl border border-outline-variant p-3">
                <input type="hidden" name="team_id" value={team.id} />
                <input
                  type="hidden"
                  name="recruiting"
                  value={String(!team.recruiting)}
                />
                <p className="text-xs leading-5 text-on-surface-variant">
                  Trạng thái tuyển:{" "}
                  <span className="font-medium text-on-surface">
                    {team.recruiting ? "Đang tuyển" : "Tạm dừng"}
                  </span>
                </p>
                <SubmitButton
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={!team.recruiting && team.status === "full"}
                  pendingText="Đang lưu…"
                >
                  {team.recruiting ? "Tạm dừng tuyển" : "Mở tuyển"}
                </SubmitButton>
              </form>
            ) : null}

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
                    : "Rời đội để tham gia đội khác."}
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
