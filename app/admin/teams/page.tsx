import type { Metadata } from "next";
import { Lock, LockOpen } from "lucide-react";
import { AdminSearch } from "@/components/admin/admin-search";
import {
  adminRemoveMemberAction,
  adminSetRecruitingAction,
  adminTransferLeaderAction,
  deleteTeamAction,
  setTeamLockedAction,
} from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlashToast } from "@/components/flash-toast";
import { formatDateTime } from "@/lib/utils/date";
import { resolvePage } from "@/lib/utils/pagination";
import { ilikePattern, searchTerm } from "@/lib/utils/search";
import type { AdminTeam } from "@/types/admin";

export const metadata: Metadata = { title: "Đội thi" };

const PAGE_SIZE = 20;

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; ok?: string; error?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const q = searchTerm(params.q);
  const filter = q
    ? `name.ilike."${ilikePattern(q)}",code.ilike."${ilikePattern(q)}"`
    : null;

  let countQuery = supabase
    .from("teams")
    .select("*", { count: "exact", head: true });
  let dataQuery = supabase
    .from("teams")
    .select(
      "id, name, status, recruiting, max_members, code, created_at, leader_id, leader:profiles!teams_leader_id_fkey(full_name), team_members(user_id, role, profile:profiles(full_name))",
    )
    .order("created_at", { ascending: false });

  if (filter) {
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  const { count } = await countQuery;
  const total = count ?? 0;
  const { page, totalPages } = resolvePage(params.page, total, PAGE_SIZE);

  const { data: teams } = await dataQuery
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .returns<AdminTeam[]>();

  const pageHref = (target: number) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return `/admin/teams${query ? `?${query}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header>
        <p className="text-sm font-medium text-primary">BTC / Admin</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
          Đội thi
        </h1>
      </header>

      <AdminSearch
        action="/admin/teams"
        q={q}
        placeholder="Tìm theo tên đội hoặc mã đội"
        clearHref="/admin/teams"
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-5">
          <h2 className="text-lg font-medium text-on-surface">Danh sách đội</h2>
          <Badge tone="neutral">{total}</Badge>
        </div>

        {teams && teams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/60 text-left text-xs text-on-surface-variant">
                  <th scope="col" className="px-5 py-3 font-medium">Đội</th>
                  <th scope="col" className="px-5 py-3 font-medium">Đội trưởng</th>
                  <th scope="col" className="px-5 py-3 font-medium">Thành viên</th>
                  <th scope="col" className="px-5 py-3 font-medium">Trạng thái</th>
                  <th scope="col" className="px-5 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {teams.map((team) => {
                  const memberCount = team.team_members?.length ?? 0;
                  const locked = team.status === "locked";
                  return (
                    <tr key={team.id} className="hover:bg-surface-container/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-on-surface">{team.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          Mã{" "}
                          <span className="select-all font-mono tracking-widest text-on-surface">
                            {team.code}
                          </span>
                          {" · "}
                          {formatDateTime(team.created_at)}
                        </p>
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs text-primary">
                            {memberCount} thành viên
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
                                  {isLeader && memberCount > 1 ? (
                                    <span className="text-[11px]">
                                      Chuyển trưởng trước
                                    </span>
                                  ) : (
                                    <ConfirmDeleteForm
                                      action={adminRemoveMemberAction}
                                      fields={[
                                        { name: "team_id", value: team.id },
                                        {
                                          name: "user_id",
                                          value: member.user_id,
                                        },
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
                                  .filter((member) => member.role !== "leader")
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
                        {memberCount}/{team.max_members}
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
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <form action={adminSetRecruitingAction}>
                            <input
                              type="hidden"
                              name="team_id"
                              value={team.id}
                            />
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
                              {team.recruiting ? "Tạm dừng" : "Mở tuyển"}
                            </SubmitButton>
                          </form>
                          <form action={setTeamLockedAction}>
                            <input
                              type="hidden"
                              name="team_id"
                              value={team.id}
                            />
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
            {q ? "Không tìm thấy đội phù hợp." : "Chưa có đội nào."}
          </p>
        )}

        <Pagination page={page} totalPages={totalPages} hrefForPage={pageHref} />
      </Card>
    </div>
  );
}
