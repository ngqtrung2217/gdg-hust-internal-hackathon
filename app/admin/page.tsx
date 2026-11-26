import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  Inbox,
  Settings,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";
import { formatDateTime } from "@/lib/utils/date";
import type { AccessRequest } from "@/types/admin";
import type { AppSettings } from "@/types/db";

export const metadata: Metadata = { title: "Tổng quan" };

const statToneClass = {
  primary: "bg-primary-container text-on-primary-container",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  error: "bg-error-container text-on-error-container",
} as const;

// Old tab links (/admin?tab=teams) keep working after the route split.
const legacyTabs: Record<string, string> = {
  settings: "/admin/settings",
  allowlist: "/admin/allowlist",
  requests: "/admin/requests",
  participants: "/admin/participants",
  announcements: "/admin/announcements",
  teams: "/admin/teams",
};

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; ok?: string; error?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;

  const legacyTarget = params.tab ? legacyTabs[params.tab] : undefined;
  if (legacyTarget) {
    const flash = params.ok ? "?ok=1" : params.error ? "?error=1" : "";
    redirect(`${legacyTarget}${flash}`);
  }

  const [
    { data: settingsRows },
    { count: profilesCount },
    { count: teamsCount },
    { count: membersCount },
    { data: accessRequestsData },
  ] = await Promise.all([
    supabase
      .from("app_settings")
      .select("allowlist_mode, max_team_size, team_creation_deadline, teams_locked")
      .eq("id", 1)
      .limit(1)
      .returns<AppSettings[]>(),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("team_members").select("*", { count: "exact", head: true }),
    supabase.rpc("admin_list_access_requests"),
  ]);

  const settings: AppSettings = settingsRows?.[0] ?? {
    allowlist_mode: true,
    max_team_size: 5,
    team_creation_deadline: null,
    teams_locked: false,
  };
  const accessRequests = (accessRequestsData as AccessRequest[] | null) ?? [];
  const pendingRequestCount = accessRequests.filter(
    (request) => request.status === "pending",
  ).length;
  const withoutTeam = Math.max(0, (profilesCount ?? 0) - (membersCount ?? 0));

  const stats = [
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
  ];

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">BTC / Admin</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
            Tổng quan
          </h1>
        </div>
        <Badge tone={settings.allowlist_mode ? "primary" : "warning"}>
          {settings.allowlist_mode ? "Allowlist đang bật" : "Allowlist đang tắt"}
        </Badge>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-on-surface-variant" aria-hidden />
            <h2 className="text-base font-medium text-on-surface">
              Cần xử lý
            </h2>
            <Badge
              tone={pendingRequestCount > 0 ? "error" : "neutral"}
              className="ml-auto"
            >
              {pendingRequestCount} yêu cầu
            </Badge>
          </div>
          <p className="text-sm leading-6 text-on-surface-variant">
            Yêu cầu truy cập đang chờ BTC duyệt.
          </p>
          <Link
            href="/admin/requests"
            className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Duyệt yêu cầu
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-on-surface-variant" aria-hidden />
            <h2 className="text-base font-medium text-on-surface">
              Cấu hình hiện tại
            </h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-on-surface-variant">Allowlist</dt>
              <dd className="text-on-surface">
                {settings.allowlist_mode ? "Đang bật" : "Đang tắt"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-on-surface-variant">Deadline chốt đội</dt>
              <dd className="text-on-surface">
                {settings.team_creation_deadline
                  ? formatDateTime(settings.team_creation_deadline)
                  : "Chưa đặt"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-on-surface-variant">Thao tác đội</dt>
              <dd className="text-on-surface">
                {settings.teams_locked ? "Đã khóa" : "Đang mở"}
              </dd>
            </div>
          </dl>
          <Link
            href="/admin/settings"
            className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Sửa cấu hình
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      </div>
    </div>
  );
}
