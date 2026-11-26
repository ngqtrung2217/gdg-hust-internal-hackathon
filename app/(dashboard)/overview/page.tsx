import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Inbox,
  Megaphone,
  Search,
  Send,
  UserRound,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
  respondToInviteAction,
} from "@/lib/actions/team";
import { AnnouncementCard } from "@/components/announcement-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashToast } from "@/components/flash-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { DEPARTMENT_LABEL, SUBTEAM_LABEL } from "@/lib/constants";
import { deadlineLabel, formatDateTime, isPast } from "@/lib/utils/date";
import type {
  Announcement,
  AppSettings,
  Department,
  Subteam,
  TeamStatus,
} from "@/types/db";

type PendingRequest = {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
    department: Department | null;
    subteam: Subteam | null;
  } | null;
};

type Membership = {
  team_id: string;
  role: "leader" | "member";
  team: {
    id: string;
    name: string;
    status: TeamStatus;
    recruiting: boolean;
    max_members: number;
    team_members: { count: number }[];
    team_join_requests: PendingRequest[];
  } | null;
};

function teamState(team: { status: TeamStatus; recruiting: boolean }) {
  if (team.status === "full") return { label: "Đã đủ", tone: "success" as const };
  if (team.status === "locked") return { label: "Đã khóa", tone: "error" as const };
  if (team.status === "archived") {
    return { label: "Lưu trữ", tone: "neutral" as const };
  }
  return team.recruiting
    ? { label: "Đang tuyển", tone: "primary" as const }
    : { label: "Tạm dừng tuyển", tone: "warning" as const };
}

type PendingInvite = {
  id: string;
  team_id: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  team: {
    id: string;
    name: string;
    max_members: number;
    status: TeamStatus;
    recruiting: boolean;
  } | null;
  inviter: { full_name: string; avatar_url: string | null } | null;
};

type SentRequest = {
  id: string;
  team_id: string;
  created_at: string;
  team: { id: string; name: string } | null;
};

type OwnProfile = {
  department: Department | null;
  subteam: Subteam | null;
  profile_skills: { count: number }[];
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { supabase, profileId } = await requireUser();
  const params = await searchParams;

  const [
    { data: settingsRows },
    { data: announcements },
    { data: memberships },
    { data: pendingInvitesData },
    { data: ownProfiles },
    { data: sentRequestsData },
  ] = await Promise.all([
    supabase
      .from("app_settings")
      .select("allowlist_mode, max_team_size, team_creation_deadline, teams_locked")
      .eq("id", 1)
      .limit(1)
      .returns<AppSettings[]>(),
    supabase
      .from("announcements")
      .select("id, title, body_md, pinned, published_at")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(20)
      .returns<Announcement[]>(),
    supabase
      .from("team_members")
      .select(
        "team_id, role, team:teams(id, name, status, recruiting, max_members, team_members(count), team_join_requests(id, user_id, message, status, created_at, profile:profiles!team_join_requests_user_id_fkey(full_name, avatar_url, department, subteam)))",
      )
      .eq("user_id", profileId)
      .limit(1)
      .returns<Membership[]>(),
    supabase
      .from("team_invites")
      .select(
        "id, team_id, message, created_at, expires_at, team:teams(id, name, max_members, status, recruiting), inviter:profiles!team_invites_inviter_id_fkey(full_name, avatar_url)",
      )
      .eq("invitee_id", profileId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<PendingInvite[]>(),
    supabase
      .from("profiles")
      .select("department, subteam, profile_skills(count)")
      .eq("id", profileId)
      .limit(1)
      .returns<OwnProfile[]>(),
    supabase
      .from("team_join_requests")
      .select("id, team_id, created_at, team:teams(id, name)")
      .eq("user_id", profileId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<SentRequest[]>(),
  ]);

  const settings = settingsRows?.[0];
  const membership = memberships?.[0];
  const team = membership?.team;
  const memberCount = team?.team_members?.[0]?.count ?? 0;
  const pendingInvites = pendingInvitesData ?? [];
  const leaderRequests = (team?.team_join_requests ?? []).filter(
    (request) => request.status === "pending",
  );
  const ownProfile = ownProfiles?.[0];
  const skillCount = ownProfile?.profile_skills?.[0]?.count ?? 0;
  const profileReady = Boolean(ownProfile?.department && ownProfile?.subteam);
  const profileIncomplete = !profileReady || skillCount === 0;
  const sentRequests = sentRequestsData ?? [];

  return (
    <div className="space-y-8">
      <FlashToast ok={params.ok} error={params.error} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Internal Hackathon 2026</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
            Tổng quan
          </h1>
        </div>
        <Badge tone={settings?.teams_locked ? "error" : "primary"}>
          {settings?.teams_locked
            ? "Đội đã khóa"
            : deadlineLabel(settings?.team_creation_deadline)}
        </Badge>
      </header>

      {pendingInvites.length > 0 ? (
        <section aria-labelledby="invites-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-on-surface-variant" aria-hidden />
            <h2
              id="invites-heading"
              className="text-xl font-medium text-on-surface"
            >
              Lời mời vào đội
            </h2>
            <Badge tone="warning">{pendingInvites.length}</Badge>
          </div>

          <div className="space-y-3">
            {pendingInvites.map((invite) => {
              const expired = isPast(invite.expires_at);
              const blocked = Boolean(team) || expired;

              return (
                <Card
                  key={invite.id}
                  className="flex flex-col gap-3 border-l-4 border-l-brand-blue p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-on-surface">
                        {invite.team?.name ?? "Đội"}
                      </p>
                      {expired ? <Badge tone="error">Đã hết hạn</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                      {invite.inviter?.full_name
                        ? `${invite.inviter.full_name} đã mời bạn`
                        : "Bạn được mời vào đội"}{" "}
                      · Hết hạn {formatDateTime(invite.expires_at)}
                    </p>
                    {invite.message ? (
                      <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                        “{invite.message}”
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <form action={respondToInviteAction}>
                      <input type="hidden" name="invite_id" value={invite.id} />
                      <input type="hidden" name="accept" value="true" />
                      <input type="hidden" name="return_to" value="/overview" />
                      <SubmitButton
                        size="sm"
                        disabled={blocked}
                        pendingText="Đang tham gia…"
                      >
                        Chấp nhận
                      </SubmitButton>
                    </form>
                    <form action={respondToInviteAction}>
                      <input type="hidden" name="invite_id" value={invite.id} />
                      <input type="hidden" name="accept" value="false" />
                      <input type="hidden" name="return_to" value="/overview" />
                      <SubmitButton
                        size="sm"
                        variant="outline"
                        pendingText="Đang từ chối…"
                      >
                        Từ chối
                      </SubmitButton>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>

          {team ? (
            <p className="text-xs leading-5 text-on-surface-variant">
              Bạn đã có đội. Rời đội trước khi nhận lời mời khác.
            </p>
          ) : null}
        </section>
      ) : null}

      {team ? (
        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-medium text-on-surface">
                  {team.name}
                </h2>
                <Badge tone={teamState(team).tone}>
                  {teamState(team).label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">
                {memberCount ?? 0}/{team.max_members} thành viên ·{" "}
                {membership.role === "leader" ? "Bạn là đội trưởng" : "Thành viên"}
              </p>
            </div>
          </div>
          <Link
            href="/team"
            className={buttonClass({ variant: "outline", size: "sm" })}
          >
            Quản lý đội
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning-container text-on-warning-container">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-medium text-on-surface">
                Bạn chưa có đội
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/team" className={buttonClass({ size: "sm" })}>
              Tạo đội
            </Link>
            <Link
              href="/teams"
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              Tìm đội
            </Link>
          </div>
        </Card>
      )}

      {team && membership?.role === "leader" && leaderRequests.length > 0 ? (
        <section aria-labelledby="join-requests-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <UserRound
              className="h-5 w-5 text-on-surface-variant"
              aria-hidden
            />
            <h2
              id="join-requests-heading"
              className="text-xl font-medium text-on-surface"
            >
              Yêu cầu vào đội
            </h2>
            <Badge tone="warning">{leaderRequests.length}</Badge>
          </div>

          <div className="space-y-3">
            {leaderRequests.map((request) => {
              const name = request.profile?.full_name ?? "Thí sinh";
              const department = request.profile?.department
                ? DEPARTMENT_LABEL[request.profile.department]
                : null;
              const area = request.profile?.subteam
                ? SUBTEAM_LABEL[request.profile.subteam]
                : null;

              return (
                <Card
                  key={request.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar
                      src={request.profile?.avatar_url}
                      name={name}
                      size={40}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface">{name}</p>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {[department, area].filter(Boolean).join(" · ") ||
                          "Chưa cập nhật ban/nhóm"}
                      </p>
                      {request.message ? (
                        <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                          “{request.message}”
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Gửi {formatDateTime(request.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <form action={approveJoinRequestAction}>
                      <input
                        type="hidden"
                        name="request_id"
                        value={request.id}
                      />
                      <input type="hidden" name="return_to" value="/overview" />
                      <SubmitButton size="sm" pendingText="Đang duyệt…">
                        Duyệt
                      </SubmitButton>
                    </form>
                    <form action={rejectJoinRequestAction}>
                      <input
                        type="hidden"
                        name="request_id"
                        value={request.id}
                      />
                      <input type="hidden" name="return_to" value="/overview" />
                      <SubmitButton
                        size="sm"
                        variant="outline"
                        pendingText="Đang từ chối…"
                      >
                        Từ chối
                      </SubmitButton>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>

          <Link
            href="/team"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Quản lý tất cả ở trang đội
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="announcements-heading" className="space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-on-surface-variant" aria-hidden />
            <h2
              id="announcements-heading"
              className="text-xl font-medium text-on-surface"
            >
              Thông báo
            </h2>
          </div>

          {announcements && announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Megaphone className="h-5 w-5" aria-hidden />}
              title="Chưa có thông báo"
              description="BTC chưa đăng thông báo nào."
            />
          )}
        </section>

        <aside className="space-y-4">
          {profileIncomplete ? (
            <Card className="border-l-4 border-l-brand-yellow p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-on-surface">
                <UserRound
                  className="h-4 w-4 text-on-surface-variant"
                  aria-hidden
                />
                Hồ sơ chưa đầy đủ
              </div>
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                {!profileReady
                  ? "Cập nhật Ban và Mảng để vào đội."
                  : "Thêm ít nhất một kỹ năng để đội khác tìm thấy bạn."}
              </p>
              <Link
                href="/profile"
                className={buttonClass({
                  variant: "outline",
                  size: "sm",
                  className: "mt-3",
                })}
              >
                Hoàn thiện hồ sơ
              </Link>
            </Card>
          ) : null}

          {sentRequests.length > 0 ? (
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-on-surface">
                <Send className="h-4 w-4 text-on-surface-variant" aria-hidden />
                Đơn xin vào đội đã gửi
              </div>
              <ul className="mt-3 space-y-2">
                {sentRequests.map((request) => (
                  <li
                    key={request.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-on-surface">
                      {request.team?.name ?? "Đội"}
                    </span>
                    <Badge tone="warning">Chờ duyệt</Badge>
                  </li>
                ))}
              </ul>
              <Link
                href="/teams"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Xem trang tìm đội
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Card>
          ) : null}

          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-on-surface">
              <CalendarClock className="h-4 w-4 text-on-surface-variant" aria-hidden />
              Deadline chốt đội
            </div>
            <p className="mt-3 text-lg font-medium text-on-surface">
              {deadlineLabel(settings?.team_creation_deadline)}
            </p>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">
              {formatDateTime(settings?.team_creation_deadline)}
            </p>
            <p className="mt-3 text-xs leading-5 text-on-surface-variant">
              3–5 người · tối đa 3 Dev, 2 Marcom/Operation.
            </p>
          </Card>

          <Card className="divide-y divide-outline-variant">
            {[
              { href: "/profile", label: "Hoàn thiện hồ sơ", icon: UserRound },
              { href: "/teams", label: "Tìm đội đang tuyển", icon: Search },
              { href: "/participants", label: "Tìm đồng đội", icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-on-surface transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-surface-container"
                >
                  <Icon className="h-4 w-4 text-on-surface-variant" aria-hidden />
                  {item.label}
                  <ArrowRight className="ml-auto h-4 w-4 text-on-surface-variant" aria-hidden />
                </Link>
              );
            })}
          </Card>
        </aside>
      </div>
    </div>
  );
}
