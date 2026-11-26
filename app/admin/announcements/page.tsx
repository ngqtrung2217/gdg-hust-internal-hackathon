import type { Metadata } from "next";
import { deleteAnnouncementAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { AnnouncementEditForm } from "@/components/admin/announcement-edit-form";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";
import { formatDateTime } from "@/lib/utils/date";
import type { Announcement } from "@/types/db";

export const metadata: Metadata = { title: "Thông báo" };

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body_md, pinned, published_at")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(100)
    .returns<Announcement[]>();

  return (
    <div className="space-y-6">
      <FlashToast ok={params.ok} error={params.error} />

      <header>
        <p className="text-sm font-medium text-primary">BTC / Admin</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
          Thông báo
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <AnnouncementForm />

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-on-surface">Đã đăng</h2>
            <Badge tone="neutral">{announcements?.length ?? 0}</Badge>
          </div>

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
    </div>
  );
}
