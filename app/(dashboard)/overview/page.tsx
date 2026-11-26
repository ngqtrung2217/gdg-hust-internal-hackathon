import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Megaphone,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { AnnouncementCard } from "@/components/announcement-card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deadlineLabel, formatDateTime } from "@/lib/utils/date";
import type { Announcement, AppSettings, TeamStatus } from "@/types/db";


type Membership = {
  team_id: string;
  role: "leader" | "member";
  team: {
    id: string;
    name: string;
    status: TeamStatus;
    max_members: number;
    team_members: { count: number }[];
  } | null;
};

export default async function OverviewPage() {
  const { supabase, profileId } = await requireUser();

  const [{ data: settingsRows }, { data: announcements }, { data: memberships }] =
    await Promise.all([
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
          "team_id, role, team:teams(id, name, status, max_members, team_members(count))",
        )
        .eq("user_id", profileId)
        .limit(1)
        .returns<Membership[]>(),
    ]);

  const settings = settingsRows?.[0];
  const membership = memberships?.[0];
  const team = membership?.team;

  const memberCount = team?.team_members?.[0]?.count ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Internal Hackathon 2026</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
            Tổng quan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Thông báo từ BTC, deadline và trạng thái đội của bạn ở một nơi.
          </p>
        </div>
        <Badge tone={settings?.teams_locked ? "error" : "primary"}>
          {settings?.teams_locked
            ? "Đội đã khóa"
            : deadlineLabel(settings?.team_creation_deadline)}
        </Badge>
      </header>

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
                <Badge tone={team.status === "full" ? "success" : "primary"}>
                  {team.status === "full"
                    ? "Đã đủ"
                    : team.status === "locked"
                      ? "Đã khóa"
                      : "Đang tuyển"}
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
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Tạo đội mới hoặc tìm một đội đang tuyển trước khi BTC khóa.
              </p>
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
              description="BTC chưa đăng thông báo nào. Hãy quay lại sau."
            />
          )}
        </section>

        <aside className="space-y-4">
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
              Đội gồm 3–5 người, tối đa 3 Developer và 2 Marcom/Operation. Sau
              deadline, BTC có thể khóa toàn bộ thao tác đội.
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
