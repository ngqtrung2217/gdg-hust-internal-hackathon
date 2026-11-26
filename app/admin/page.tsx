import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  Inbox,
  Lock,
  LockOpen,
  Megaphone,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  adminRemoveMemberAction,
  adminSetRecruitingAction,
  adminTransferLeaderAction,
  approveAccessRequestAction,
  deleteAnnouncementAction,
  deleteTeamAction,
  rejectAccessRequestAction,
  setTeamLockedAction,
} from "@/lib/actions/admin";
import { SettingsForm } from "@/components/admin/settings-form";
import { AllowlistEditDialog } from "@/components/admin/allowlist-edit-dialog";
import { AllowlistImportForm } from "@/components/admin/allowlist-import-form";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { AnnouncementEditForm } from "@/components/admin/announcement-edit-form";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlashToast } from "@/components/flash-toast";
import { formatDateTime } from "@/lib/utils/date";
import type {
  AllowlistRow,
  Announcement,
  AppSettings,
  Profile,
  TeamStatus,
} from "@/types/db";


type AdminTeam = {
  id: string;
  name: string;
  status: TeamStatus;
  recruiting: boolean;
  max_members: number;
  created_at: string;
  leader_id: string;
  leader: Pick<Profile, "full_name"> | null;
  team_members: {
    user_id: string;
    role: "leader" | "member";
    profile: { full_name: string } | null;
  }[];
};

type AdminProfile = Profile & {
  team_members: { team: { name: string } | null }[];
};

type AccessRequest = {
  id: string;
  email: string;
  google_sub: string | null;
  full_name: string | null;
  avatar_url: string | null;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
};

const tabs = [
  { id: "settings", label: "Cấu hình", icon: Settings },
  { id: "allowlist", label: "Danh sách", icon: ShieldCheck },
  { id: "requests", label: "Yêu cầu", icon: Inbox },
  { id: "participants", label: "Thí sinh", icon: UserCheck },
  { id: "announcements", label: "Thông báo", icon: Megaphone },
  { id: "teams", label: "Đội thi", icon: Users },
] as const;

const PAGE_SIZE = {
  allowlist: 25,
  requests: 25,
  participants: 25,
  teams: 20,
} as const;

const statToneClass = {
  primary: "bg-primary-container text-on-primary-container",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  error: "bg-error-container text-on-error-container",
} as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    ok?: string;
    error?: string;
  }>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const tab = tabs.some((item) => item.id === params.tab)
    ? params.tab
    : "settings";

  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const pageNumber =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const tabHref = (targetTab: string, targetPage: number) =>
    targetPage > 1
      ? `/admin?tab=${targetTab}&page=${targetPage}`
      : `/admin?tab=${targetTab}`;

  const [
    { data: settingsRows },
    { data: allowlistData },
    { data: accessRequestsData },
    { data: announcements },
    { data: teams },
    { data: profiles },
    { count: profilesCount },
    { count: teamsCount },
    { count: membersCount },
  ] = await Promise.all([
    supabase
      .from("app_settings")
      .select("allowlist_mode, max_team_size, team_creation_deadline, teams_locked")
      .eq("id", 1)
      .limit(1)
      .returns<AppSettings[]>(),
    tab === "allowlist"
      ? supabase.rpc("admin_list_allowlist")
      : Promise.resolve({ data: [] as AllowlistRow[] }),
    supabase.rpc("admin_list_access_requests"),
    tab === "announcements"
      ? supabase
          .from("announcements")
          .select("id, title, body_md, pinned, published_at")
          .order("pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(50)
          .returns<Announcement[]>()
      : Promise.resolve({ data: [] as Announcement[] }),
    tab === "teams"
      ? supabase
          .from("teams")
          .select(
            "id, name, status, recruiting, max_members, created_at, leader_id, leader:profiles!teams_leader_id_fkey(full_name), team_members(user_id, role, profile:profiles(full_name))",
          )
          .order("created_at", { ascending: false })
          .range(
            (pageNumber - 1) * PAGE_SIZE.teams,
            pageNumber * PAGE_SIZE.teams - 1,
          )
          .returns<AdminTeam[]>()
      : Promise.resolve({ data: [] as AdminTeam[] }),
    tab === "participants"
      ? supabase
          .from("profiles")
          .select("*, team_members(team:teams(name))")
          .order("full_name", { ascending: true })
          .range(
            (pageNumber - 1) * PAGE_SIZE.participants,
            pageNumber * PAGE_SIZE.participants - 1,
          )
          .returns<AdminProfile[]>()
      : Promise.resolve({ data: [] as AdminProfile[] }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase
      .from("team_members")
      .select("*", { count: "exact", head: true }),
  ]);

  const settings: AppSettings = settingsRows?.[0] ?? {
    allowlist_mode: true,
    max_team_size: 5,
    team_creation_deadline: null,
    teams_locked: false,
  };
  const allowlist = (allowlistData as AllowlistRow[] | null) ?? [];
  const accessRequests = (accessRequestsData as AccessRequest[] | null) ?? [];
  const pendingRequestCount = accessRequests.filter(
    (request) => request.status === "pending",
  ).length;
  const withoutTeam = Math.max(
    0,
    (profilesCount ?? 0) - (membersCount ?? 0),
  );

  const allowlistTotal = allowlist.length;
  const allowlistPages = Math.max(
    1,
    Math.ceil(allowlistTotal / PAGE_SIZE.allowlist),
  );
  const allowlistPage = Math.min(pageNumber, allowlistPages);
  const allowlistRows = allowlist.slice(
    (allowlistPage - 1) * PAGE_SIZE.allowlist,
    allowlistPage * PAGE_SIZE.allowlist,
  );

  const requestsTotal = accessRequests.length;
  const requestsPages = Math.max(
    1,
    Math.ceil(requestsTotal / PAGE_SIZE.requests),
  );
  const requestsPage = Math.min(pageNumber, requestsPages);
  const requestRows = accessRequests.slice(
    (requestsPage - 1) * PAGE_SIZE.requests,
    requestsPage * PAGE_SIZE.requests,
  );

  const participantsTotal = profilesCount ?? 0;
  const participantsPages = Math.max(
    1,
    Math.ceil(participantsTotal / PAGE_SIZE.participants),
  );
  const participantsPage = Math.min(pageNumber, participantsPages);

  const teamsTotal = teamsCount ?? 0;
  const teamsPages = Math.max(1, Math.ceil(teamsTotal / PAGE_SIZE.teams));
  const teamsPage = Math.min(pageNumber, teamsPages);

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">BTC / Admin</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
            Quản trị cuộc thi
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Cấu hình cuộc thi, danh sách truy cập, thông báo và đội.
          </p>
        </div>
        <Badge tone={settings.allowlist_mode ? "primary" : "warning"}>
          {settings.allowlist_mode ? "Allowlist đang bật" : "Allowlist đang tắt"}
        </Badge>
      </header>

      {params.error ? (
        <div className="flex gap-2 rounded-xl bg-error-container p-4 text-sm text-on-error-container">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Thao tác không thành công. Kiểm tra lại dữ liệu.
        </div>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Thí sinh",
            value: profilesCount ?? 0,
            icon: UsersRound,
            tone: "primary" as const,
          },
          {
            label: "Đội thi",
            value: teamsCount ?? 0,
            icon: Users,
            tone: "success" as const,
          },
          {
            label: "Đã vào đội",
            value: membersCount ?? 0,
            icon: UserCheck,
            tone: "warning" as const,
          },
          {
            label: "Chưa có đội",
            value: withoutTeam,
            icon: CalendarClock,
            tone: "error" as const,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${statToneClass[stat.tone]}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <dd className="mt-3 text-2xl font-medium tabular-nums text-on-surface">
                {stat.value}
              </dd>
              <dt className="mt-1 text-xs text-on-surface-variant">
                {stat.label}
              </dt>
            </Card>
          );
        })}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-outline-variant bg-surface p-1.5 lg:flex-col">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <Link
                  key={item.id}
                  href={`/admin?tab=${item.id}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary-container px-3.5 py-2.5 text-sm font-medium text-on-primary-container"
                      : "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  }
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                  {item.label}
                  {item.id === "requests" && pendingRequestCount > 0 ? (
                    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-error-container px-1.5 py-0.5 text-[10px] font-medium text-on-error-container">
                      {pendingRequestCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 hidden rounded-2xl border border-outline-variant bg-surface p-4 lg:block">
            <p className="text-xs text-on-surface-variant">Allowlist</p>
            <p className="mt-1 text-sm font-medium text-on-surface">
              {settings.allowlist_mode ? "Đang bật" : "Đang tắt"}
            </p>
            <p className="mt-3 text-xs text-on-surface-variant">Deadline</p>
            <p className="mt-1 text-sm font-medium text-on-surface">
              {settings.team_creation_deadline
                ? formatDateTime(settings.team_creation_deadline)
                : "Chưa đặt"}
            </p>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">

      {tab === "settings" ? <SettingsForm settings={settings} /> : null}

      {tab === "allowlist" ? (
        <div className="space-y-6">
          <AllowlistImportForm />

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-5">
              <div>
                <h2 className="text-lg font-medium text-on-surface">
                  Danh sách truy cập
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {allowlistTotal} email.
                </p>
              </div>
              <Badge tone="neutral">{allowlistTotal}</Badge>
            </div>

            {allowlistRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container/60 text-left text-xs text-on-surface-variant">
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Họ tên</th>
                      <th className="px-5 py-3 font-medium">Ngành / Khóa</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Trạng thái</th>
                      <th className="px-5 py-3 text-right font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {allowlistRows.map((row) => (
                      <tr key={row.email} className="hover:bg-surface-container/50">
                        <td className="px-5 py-3 font-mono text-xs text-on-surface">
                          {row.email}
                        </td>
                        <td className="px-5 py-3 text-on-surface">
                          {row.full_name || "—"}
                        </td>
                        <td className="px-5 py-3 text-on-surface-variant">
                          {[row.major, row.cohort].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={row.role === "admin" ? "primary" : "neutral"}>
                            {row.role === "admin" ? "BTC" : "Thí sinh"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge tone={row.active ? "success" : "error"}>
                              {row.active ? "Active" : "Đã khóa"}
                            </Badge>
                            {row.claimed ? (
                              <Badge tone="neutral">Đã đăng nhập</Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <AllowlistEditDialog row={row} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-6 text-sm text-on-surface-variant">
                Danh sách đang trống.
              </p>
            )}

            <Pagination
              page={allowlistPage}
              totalPages={allowlistPages}
              hrefForPage={(page) => tabHref("allowlist", page)}
            />
          </Card>
        </div>
      ) : null}

      {tab === "requests" ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-5">
            <div>
              <h2 className="text-lg font-medium text-on-surface">
                Yêu cầu truy cập
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Người đăng nhập bằng Google nhưng chưa có email trong danh sách.
              </p>
            </div>
            <Badge tone={pendingRequestCount > 0 ? "error" : "neutral"}>
              {pendingRequestCount} chờ
            </Badge>
          </div>

          {requestRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container/60 text-left text-xs text-on-surface-variant">
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Họ tên</th>
                    <th className="px-5 py-3 font-medium">Google sub</th>
                    <th className="px-5 py-3 font-medium">Yêu cầu lúc</th>
                    <th className="px-5 py-3 font-medium">Trạng thái</th>
                    <th className="px-5 py-3 font-medium">Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {requestRows.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-surface-container/50"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-on-surface">
                        {request.email}
                      </td>
                      <td className="px-5 py-3 text-on-surface">
                        {request.full_name || "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-on-surface-variant">
                        {request.google_sub || "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-on-surface-variant">
                        {formatDateTime(request.requested_at)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          tone={
                            request.status === "pending"
                              ? "warning"
                              : request.status === "approved"
                                ? "success"
                                : "error"
                          }
                        >
                          {request.status === "pending"
                            ? "Chờ duyệt"
                            : request.status === "approved"
                              ? "Đã duyệt"
                              : "Từ chối"}
                        </Badge>
                        {request.reviewed_at ? (
                          <p className="mt-1 text-[11px] text-on-surface-variant">
                            {formatDateTime(request.reviewed_at)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        {request.status === "pending" ? (
                          <div className="flex flex-col gap-2">
                            <form
                              action={approveAccessRequestAction}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="hidden"
                                name="id"
                                value={request.id}
                              />
                              <div className="w-32">
                                <Select
                                  name="role"
                                  defaultValue="participant"
                                  aria-label="Role"
                                  className="h-9 text-xs"
                                >
                                  <option value="participant">Thí sinh</option>
                                  <option value="admin">BTC</option>
                                </Select>
                              </div>
                              <SubmitButton
                                size="sm"
                                pendingText="Đang duyệt…"
                              >
                                Duyệt
                              </SubmitButton>
                            </form>
                            <form action={rejectAccessRequestAction}>
                              <input
                                type="hidden"
                                name="id"
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
                        ) : (
                          <span className="text-xs text-on-surface-variant">
                            Đã xử lý
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-sm text-on-surface-variant">
              Chưa có yêu cầu truy cập.
            </p>
          )}

          <Pagination
            page={requestsPage}
            totalPages={requestsPages}
            hrefForPage={(page) => tabHref("requests", page)}
          />
        </Card>
      ) : null}

      {tab === "participants" ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-5">
            <div>
              <h2 className="text-lg font-medium text-on-surface">Thí sinh</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {participantsTotal} hồ sơ đã đăng nhập.
              </p>
            </div>
            <Badge tone="primary">{participantsTotal}</Badge>
          </div>

          {profiles && profiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container/60 text-left text-xs text-on-surface-variant">
                    <th className="px-5 py-3 font-medium">Thí sinh</th>
                    <th className="px-5 py-3 font-medium">MSSV</th>
                    <th className="px-5 py-3 font-medium">Ngành / Khóa</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Đội</th>
                    <th className="px-5 py-3 font-medium">Tìm đội</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {profiles.map((profile) => {
                    const teamName =
                      profile.team_members?.[0]?.team?.name ?? "—";
                    return (
                      <tr
                        key={profile.id}
                        className="hover:bg-surface-container/50"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-on-surface">
                            {profile.full_name || "—"}
                          </p>
                          <p className="font-mono text-xs text-on-surface-variant">
                            {profile.email}
                          </p>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-on-surface-variant">
                          {profile.student_id ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-on-surface-variant">
                          {[profile.major, profile.cohort]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            tone={
                              profile.role === "admin" ? "primary" : "neutral"
                            }
                          >
                            {profile.role === "admin" ? "BTC" : "Thí sinh"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-on-surface">
                          {teamName}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            tone={
                              profile.open_to_invites ? "success" : "neutral"
                            }
                          >
                            {profile.open_to_invites ? "Đang mở" : "Đang tắt"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-sm text-on-surface-variant">
              Chưa có thí sinh nào đăng nhập.
            </p>
          )}

          <Pagination
            page={participantsPage}
            totalPages={participantsPages}
            hrefForPage={(page) => tabHref("participants", page)}
          />
        </Card>
      ) : null}

      {tab === "announcements" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <AnnouncementForm />

          <Card className="p-6">
            <h2 className="text-lg font-medium text-on-surface">
              Thông báo đã đăng
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {announcements?.length ?? 0} thông báo.
            </p>

            {announcements && announcements.length > 0 ? (
              <ul className="mt-4 divide-y divide-outline-variant">
                {announcements.map((announcement) => (
                  <li key={announcement.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-medium text-on-surface">
                            {announcement.title}
                          </h3>
                          {announcement.pinned ? (
                            <Badge tone="warning">Ghim</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {formatDateTime(announcement.published_at)}
                        </p>
                      </div>
                      <ConfirmDeleteForm
                        action={deleteAnnouncementAction}
                        fields={[{ name: "id", value: announcement.id }]}
                        description={`Xóa "${announcement.title}"? Không thể hoàn tác.`}
                        confirmLabel="Xóa thông báo"
                      />
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-primary">
                        Sửa
                      </summary>
                      <AnnouncementEditForm announcement={announcement} />
                    </details>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-on-surface-variant">
                Chưa có thông báo.
              </p>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "teams" ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-5">
            <div>
              <h2 className="text-lg font-medium text-on-surface">
                Danh sách đội
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {teamsTotal} đội.
              </p>
            </div>
          </div>

          {teams && teams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container/60 text-left text-xs text-on-surface-variant">
                    <th className="px-5 py-3 font-medium">Đội</th>
                    <th className="px-5 py-3 font-medium">Đội trưởng</th>
                    <th className="px-5 py-3 font-medium">Thành viên</th>
                    <th className="px-5 py-3 font-medium">Trạng thái</th>
                    <th className="px-5 py-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {teams.map((team) => {
                    const count = team.team_members?.length ?? 0;
                    const locked = team.status === "locked";
                    return (
                      <tr key={team.id} className="hover:bg-surface-container/50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-on-surface">{team.name}</p>
                          <p className="text-xs text-on-surface-variant">
                            {formatDateTime(team.created_at)}
                          </p>
                          <details className="mt-1">
                            <summary className="cursor-pointer text-xs text-primary">
                              {count} thành viên
                            </summary>
                            <ul className="mt-2 space-y-1.5">
                              {team.team_members.map((member) => {
                                const name =
                                  member.profile?.full_name ?? member.user_id;
                                const isLeader = member.role === "leader";
                                return (
                                  <li
                                    key={member.user_id}
                                    className="flex items-center justify-between gap-2 text-xs text-on-surface-variant"
                                  >
                                    <span>
                                      {name}
                                      {isLeader ? " · đội trưởng" : ""}
                                    </span>
                                    {isLeader && count > 1 ? (
                                      <span className="text-[11px]">
                                        Chuyển trưởng trước
                                      </span>
                                    ) : (
                                      <ConfirmDeleteForm
                                        action={adminRemoveMemberAction}
                                        fields={[
                                          { name: "team_id", value: team.id },
                                          { name: "user_id", value: member.user_id },
                                        ]}
                                        title="Xóa"
                                        description={`Xóa ${name} khỏi đội?`}
                                        confirmLabel="Xóa thành viên"
                                      />
                                    )}
                                  </li>
                                );
                              })}
                            </ul>

                            {team.team_members.some(
                              (member) => member.role !== "leader",
                            ) ? (
                              <form
                                action={adminTransferLeaderAction}
                                className="mt-3 space-y-1.5"
                              >
                                <input
                                  type="hidden"
                                  name="team_id"
                                  value={team.id}
                                />
                                <select
                                  name="new_leader_id"
                                  required
                                  className="h-9 w-full rounded-lg border border-outline-variant bg-surface px-2 text-xs"
                                >
                                  <option value="">Chọn đội trưởng mới</option>
                                  {team.team_members
                                    .filter(
                                      (member) => member.role !== "leader",
                                    )
                                    .map((member) => (
                                      <option
                                        key={member.user_id}
                                        value={member.user_id}
                                      >
                                        {member.profile?.full_name ??
                                          member.user_id}
                                      </option>
                                    ))}
                                </select>
                                <SubmitButton
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  pendingText="Đang chuyển…"
                                >
                                  Chuyển đội trưởng
                                </SubmitButton>
                              </form>
                            ) : null}
                          </details>
                        </td>
                        <td className="px-5 py-3 text-on-surface-variant">
                          {team.leader?.full_name ?? "—"}
                        </td>
                        <td className="px-5 py-3 font-mono tabular-nums text-on-surface">
                          {count}/{team.max_members}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            tone={
                              team.status === "locked"
                                ? "error"
                                : team.status === "archived"
                                  ? "neutral"
                                  : team.status === "full"
                                    ? "success"
                                    : !team.recruiting
                                      ? "warning"
                                      : "primary"
                            }
                          >
                            {team.status === "locked"
                              ? "Đã khóa"
                              : team.status === "archived"
                                ? "Lưu trữ"
                                : team.status === "full"
                                  ? "Đã đủ"
                                  : !team.recruiting
                                    ? "Tạm dừng"
                                    : "Đang tuyển"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col items-end gap-2">
                            <form action={adminSetRecruitingAction}>
                              <input type="hidden" name="team_id" value={team.id} />
                              <input
                                type="hidden"
                                name="recruiting"
                                value={String(!team.recruiting)}
                              />
                              <SubmitButton
                                size="sm"
                                variant="outline"
                                pendingText="Đang lưu…"
                                disabled={
                                  team.status === "locked" ||
                                  team.status === "archived" ||
                                  (!team.recruiting && team.status === "full")
                                }
                              >
                                {team.recruiting ? "Tạm dừng tuyển" : "Mở tuyển"}
                              </SubmitButton>
                            </form>
                            <form action={setTeamLockedAction}>
                              <input type="hidden" name="team_id" value={team.id} />
                              <input
                                type="hidden"
                                name="locked"
                                value={locked ? "false" : "true"}
                              />
                              <SubmitButton
                                size="sm"
                                variant="outline"
                                pendingText="Đang lưu…"
                              >
                                {locked ? (
                                  <LockOpen className="h-4 w-4" aria-hidden />
                                ) : (
                                  <Lock className="h-4 w-4" aria-hidden />
                                )}
                                {locked ? "Mở khóa" : "Khóa"}
                              </SubmitButton>
                            </form>
                            <ConfirmDeleteForm
                              action={deleteTeamAction}
                              fields={[{ name: "team_id", value: team.id }]}
                              description={`Xóa đội "${team.name}" và toàn bộ thành viên?`}
                              confirmLabel="Xóa đội"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-sm text-on-surface-variant">
              Chưa có đội nào.
            </p>
          )}

          <Pagination
            page={teamsPage}
            totalPages={teamsPages}
            hrefForPage={(page) => tabHref("teams", page)}
          />
        </Card>
      ) : null}

        </div>
      </div>

      {params.error ? (
        <p className="flex items-center gap-2 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          Nếu lỗi lặp lại, kiểm tra quyền admin và trạng thái allowlist.
        </p>
      ) : null}
    </div>
  );
}
