import type { Metadata } from "next";
import { AdminSearch } from "@/components/admin/admin-search";
import { requireAdmin } from "@/lib/auth/require-admin";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { FlashToast } from "@/components/flash-toast";
import { resolvePage } from "@/lib/utils/pagination";
import { ilikePattern, searchTerm } from "@/lib/utils/search";
import type { AdminProfile } from "@/types/admin";

export const metadata: Metadata = { title: "Thí sinh" };

const PAGE_SIZE = 25;

export default async function AdminParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; ok?: string; error?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const q = searchTerm(params.q);
  const filter = q
    ? `full_name.ilike."${ilikePattern(q)}",email.ilike."${ilikePattern(q)}",student_id.ilike."${ilikePattern(q)}"`
    : null;

  let countQuery = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  let dataQuery = supabase
    .from("profiles")
    .select("*, team_members(team:teams(name))")
    .order("full_name", { ascending: true });

  if (filter) {
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  const { count } = await countQuery;
  const total = count ?? 0;
  const { page, totalPages } = resolvePage(params.page, total, PAGE_SIZE);

  const { data: profiles } = await dataQuery
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .returns<AdminProfile[]>();

  const pageHref = (target: number) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return `/admin/participants${query ? `?${query}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header>
        <p className="text-sm font-medium text-primary">BTC / Admin</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
          Thí sinh
        </h1>
      </header>

      <AdminSearch
        action="/admin/participants"
        q={q}
        placeholder="Tìm theo tên, email hoặc MSSV"
        clearHref="/admin/participants"
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-5">
          <h2 className="text-lg font-medium text-on-surface">Danh sách</h2>
          <Badge tone="primary">{total}</Badge>
        </div>

        {profiles && profiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/60 text-left text-xs text-on-surface-variant">
                  <th scope="col" className="px-5 py-3 font-medium">Thí sinh</th>
                  <th scope="col" className="px-5 py-3 font-medium">MSSV</th>
                  <th scope="col" className="px-5 py-3 font-medium">Ngành / Khóa</th>
                  <th scope="col" className="px-5 py-3 font-medium">Role</th>
                  <th scope="col" className="px-5 py-3 font-medium">Đội</th>
                  <th scope="col" className="px-5 py-3 font-medium">Tìm đội</th>
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
                      <td className="px-5 py-3 text-on-surface">{teamName}</td>
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
            {q ? "Không tìm thấy thí sinh phù hợp." : "Chưa có thí sinh nào đăng nhập."}
          </p>
        )}

        <Pagination page={page} totalPages={totalPages} hrefForPage={pageHref} />
      </Card>
    </div>
  );
}
