import { AlertCircle, CheckCircle2, Users, UsersRound } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { ParticipantCard } from "@/components/participant-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashToast } from "@/components/flash-toast";
import type { ProfileWithSkills, TeamStatus } from "@/types/db";


type Membership = {
  team_id: string;
  role: "leader" | "member";
  team: {
    id: string;
    name: string;
    max_members: number;
    status: TeamStatus;
    team_members: { count: number }[];
  } | null;
};

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { supabase, profileId } = await requireUser();
  const params = await searchParams;

  const [{ data: memberships }, { data: profiles }, { data: allMembers }] =
    await Promise.all([
      supabase
        .from("team_members")
        .select(
          "team_id, role, team:teams(id, name, max_members, status, team_members(count))",
        )
        .eq("user_id", profileId)
        .limit(1)
        .returns<Membership[]>(),
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, contact_email, avatar_url, headline, bio, major, cohort, student_id, department, subteam, facebook_url, github_url, open_to_invites, profile_skills(skill_id, level, skill:skill_catalog(id, name, category))",
        )
        .eq("open_to_invites", true)
        .neq("id", profileId)
        .limit(100)
        .returns<ProfileWithSkills[]>(),
      supabase
        .from("team_members")
        .select("user_id")
        .returns<{ user_id: string }[]>(),
    ]);

  const membership = memberships?.[0];
  const team = membership?.team;
  const isLeader = membership?.role === "leader";

  const taken = new Set((allMembers ?? []).map((row) => row.user_id));
  const candidates = (profiles ?? []).filter(
    (profile) => !taken.has(profile.id),
  );

  const { data: invites } = team
    ? await supabase
        .from("team_invites")
        .select("invitee_id")
        .eq("team_id", team.id)
        .eq("status", "pending")
        .returns<{ invitee_id: string }[]>()
    : { data: [] as { invitee_id: string }[] };

  const invited = new Set((invites ?? []).map((row) => row.invitee_id));

  const teamCount = team?.team_members?.[0]?.count ?? 0;

  const teamFull = team ? teamCount >= team.max_members : false;

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header>
        <p className="text-sm font-medium text-primary">Ghép đội</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
          Tìm đồng đội
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
          Những thí sinh đang mở nhận lời mời và chưa thuộc đội nào. Chỉ đội
          trưởng mới gửi được lời mời. Mỗi đội tối đa 3 Developer và 2
          Marcom/Operation.
        </p>
      </header>

      {params.ok ? (
        <div className="flex items-center gap-2 rounded-xl bg-success-container p-4 text-sm text-on-success-container">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Đã gửi lời mời.
        </div>
      ) : null}
      {params.error ? (
        <div className="flex gap-2 rounded-xl bg-error-container p-4 text-sm text-on-error-container">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {params.error}
        </div>
      ) : null}

      {!team ? (
        <Card className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-on-surface">
            <UsersRound className="h-5 w-5 text-on-surface-variant" aria-hidden />
            Bạn chưa có đội. Tạo đội trước khi mời đồng đội.
          </div>
          <a
            href="/team"
            className="text-sm font-medium text-primary hover:underline"
          >
            Tạo đội
          </a>
        </Card>
      ) : !isLeader ? (
        <Card className="flex items-center gap-3 p-5 text-sm text-on-surface">
          <Users className="h-5 w-5 text-on-surface-variant" aria-hidden />
          Bạn là thành viên của <strong>{team.name}</strong>. Chỉ đội trưởng mới
          gửi được lời mời.
        </Card>
      ) : teamFull ? (
        <Card className="flex items-center gap-3 p-5 text-sm text-on-surface">
          <Users className="h-5 w-5 text-on-surface-variant" aria-hidden />
          Đội <strong>{team.name}</strong> đã đủ {team.max_members} người.
        </Card>
      ) : null}

      {candidates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {candidates.map((profile) => (
            <ParticipantCard
              key={profile.id}
              profile={profile}
              alreadyInvited={invited.has(profile.id)}
              canInvite={Boolean(team && isLeader && !teamFull)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<UsersRound className="h-5 w-5" aria-hidden />}
          title="Chưa có ai đang tìm đội"
          description="Khi thí sinh bật “Đang tìm đội”, hồ sơ sẽ xuất hiện ở đây."
        />
      )}
    </div>
  );
}
