import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { deleteAnnouncementAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { AnnouncementEditForm } from "@/components/admin/announcement-edit-form";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashToast } from "@/components/flash-toast";
import { formatDateTime } from "@/lib/utils/date";
import type { Announcement } from "@/types/db";

function excerpt(markdown: string) {
  return markdown
    .replace(/[#*_>`~[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

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
            <ul className="mt-4 space-y-3">
              {announcements.map((announcement) => {
                const preview = excerpt(announcement.body_md);
                return (
                  <li
                    key={announcement.id}
                    className="rounded-xl border border-outline-variant p-4"
                  >
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

                    {preview ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-on-surface-variant">
                        {preview}
                      </p>
                    ) : null}

                    <details className="mt-3 border-t border-outline-variant pt-2">
                      <summary className="cursor-pointer text-xs font-medium text-primary">
                        Sửa
                      </summary>
                      <div className="mt-3">
                        <AnnouncementEditForm announcement={announcement} />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              className="mt-4"
              icon={<Megaphone className="h-5 w-5" aria-hidden />}
              title="Chưa có thông báo"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
