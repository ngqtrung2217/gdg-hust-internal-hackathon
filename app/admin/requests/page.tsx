import type { Metadata } from "next";
import {
  approveAccessRequestAction,
  rejectAccessRequestAction,
} from "@/lib/actions/admin";
import { AdminSearch } from "@/components/admin/admin-search";
import { requireAdmin } from "@/lib/auth/require-admin";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SubmitButton } from "@/components/ui/submit-button";
import { FlashToast } from "@/components/flash-toast";
import { formatDateTime } from "@/lib/utils/date";
import { buildPageHref, resolvePage } from "@/lib/utils/pagination";
import type { AccessRequest } from "@/types/admin";

export const metadata: Metadata = { title: "Yêu cầu truy cập" };

const PAGE_SIZE = 25;

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; ok?: string; error?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const statusFilter =
    params.status === "pending" ||
    params.status === "approved" ||
    params.status === "rejected"
      ? params.status
      : "";

  const { data } = await supabase.rpc("admin_list_access_requests");
  const allRequests = (data as AccessRequest[] | null) ?? [];
  const pendingRequestCount = allRequests.filter(
    (request) => request.status === "pending",
  ).length;
  const requests = statusFilter
    ? allRequests.filter((request) => request.status === statusFilter)
    : allRequests;
  const { page, totalPages } = resolvePage(
    params.page,
    requests.length,
    PAGE_SIZE,
  );
  const pageRows = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageHref = (target: number) =>
    buildPageHref("/admin/requests", { status: statusFilter }, target);

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header>
        <p className="text-sm font-medium text-primary">BTC / Admin</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
          Yêu cầu truy cập
        </h1>
      </header>

      <AdminSearch
        action="/admin/requests"
        placeholder=""
        clearHref="/admin/requests"
        showSearch={false}
        filters={[
          {
            name: "status",
            label: "Trạng thái",
            value: statusFilter,
            options: [
              { value: "", label: "Tất cả trạng thái" },
              { value: "pending", label: "Chờ duyệt" },
              { value: "approved", label: "Đã duyệt" },
              { value: "rejected", label: "Từ chối" },
            ],
          },
        ]}
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-5">
          <p className="text-sm text-on-surface-variant">
            Người đăng nhập bằng Google nhưng chưa có email trong danh sách.
          </p>
          <Badge tone={pendingRequestCount > 0 ? "error" : "neutral"}>
            {pendingRequestCount} chờ
          </Badge>
        </div>

        {pageRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/60 text-left text-xs text-on-surface-variant">
                  <th scope="col" className="px-5 py-3 font-medium">Email</th>
                  <th scope="col" className="px-5 py-3 font-medium">Họ tên</th>
                  <th scope="col" className="px-5 py-3 font-medium">Google sub</th>
                  <th scope="col" className="px-5 py-3 font-medium">Yêu cầu lúc</th>
                  <th scope="col" className="px-5 py-3 font-medium">Trạng thái</th>
                  <th scope="col" className="px-5 py-3 font-medium">Duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {pageRows.map((request) => (
                  <tr key={request.id} className="hover:bg-surface-container/50">
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
                            <input type="hidden" name="id" value={request.id} />
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
                            <SubmitButton size="sm" pendingText="Đang duyệt…">
                              Duyệt
                            </SubmitButton>
                          </form>
                          <form action={rejectAccessRequestAction}>
                            <input type="hidden" name="id" value={request.id} />
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
            {statusFilter ? "Không có yêu cầu ở trạng thái này." : "Chưa có yêu cầu truy cập."}
          </p>
        )}

        <Pagination page={page} totalPages={totalPages} hrefForPage={pageHref} />
      </Card>
    </div>
  );
}
