import type { Metadata } from "next";
import { AdminSearch } from "@/components/admin/admin-search";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AllowlistEditDialog } from "@/components/admin/allowlist-edit-dialog";
import { AllowlistImportForm } from "@/components/admin/allowlist-import-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { FlashToast } from "@/components/flash-toast";
import { buildPageHref, resolvePage } from "@/lib/utils/pagination";
import { matchesTerm, searchTerm } from "@/lib/utils/search";
import type { AllowlistRow } from "@/types/db";

export const metadata: Metadata = { title: "Danh sách truy cập" };

const PAGE_SIZE = 25;

export default async function AdminAllowlistPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
    ok?: string;
    error?: string;
  }>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const q = searchTerm(params.q);
  const roleFilter =
    params.role === "participant" || params.role === "admin" ? params.role : "";
  const statusFilter =
    params.status === "active" || params.status === "locked"
      ? params.status
      : "";

  const { data } = await supabase.rpc("admin_list_allowlist");
  const allRows = (data as AllowlistRow[] | null) ?? [];
  const rows = allRows.filter(
    (row) =>
      matchesTerm(q, row.email, row.full_name, row.major, row.cohort) &&
      (!roleFilter || row.role === roleFilter) &&
      (!statusFilter ||
        (statusFilter === "active" ? row.active : !row.active)),
  );
  const { page, totalPages } = resolvePage(params.page, rows.length, PAGE_SIZE);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageHref = (target: number) =>
    buildPageHref(
      "/admin/allowlist",
      { q, role: roleFilter, status: statusFilter },
      target,
    );

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header>
        <p className="text-sm font-medium text-primary">BTC / Admin</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
          Danh sách truy cập
        </h1>
      </header>

      <AllowlistImportForm />

      <AdminSearch
        action="/admin/allowlist"
        q={q}
        placeholder="Tìm theo email, tên hoặc ngành"
        clearHref="/admin/allowlist"
        filters={[
          {
            name: "role",
            label: "Role",
            value: roleFilter,
            options: [
              { value: "", label: "Tất cả role" },
              { value: "participant", label: "Thí sinh" },
              { value: "admin", label: "BTC" },
            ],
          },
          {
            name: "status",
            label: "Trạng thái",
            value: statusFilter,
            options: [
              { value: "", label: "Tất cả trạng thái" },
              { value: "active", label: "Đang hoạt động" },
              { value: "locked", label: "Đã khóa" },
            ],
          },
        ]}
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-5">
          <h2 className="text-lg font-medium text-on-surface">
            Danh sách truy cập
          </h2>
          <Badge tone="neutral">{rows.length}</Badge>
        </div>

        {pageRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/60 text-left text-xs text-on-surface-variant">
                  <th scope="col" className="px-5 py-3 font-medium">Email</th>
                  <th scope="col" className="px-5 py-3 font-medium">Họ tên</th>
                  <th scope="col" className="px-5 py-3 font-medium">Ngành / Khóa</th>
                  <th scope="col" className="px-5 py-3 font-medium">Role</th>
                  <th scope="col" className="px-5 py-3 font-medium">Trạng thái</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {pageRows.map((row) => (
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
            {q ? "Không tìm thấy email phù hợp." : "Danh sách đang trống."}
          </p>
        )}

        <Pagination page={page} totalPages={totalPages} hrefForPage={pageHref} />
      </Card>
    </div>
  );
}
