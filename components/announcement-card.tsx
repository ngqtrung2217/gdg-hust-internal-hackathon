import { Pin } from "lucide-react";
import type { Announcement } from "@/types/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { formatDateTime } from "@/lib/utils/date";

export function AnnouncementCard({
  announcement,
}: {
  announcement: Announcement;
}) {
  return (
    <Card
      className={
        announcement.pinned
          ? "border-l-4 border-l-brand-yellow p-6"
          : "border-l-4 border-l-primary p-6"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {announcement.pinned ? (
          <Badge tone="warning">
            <Pin className="h-3.5 w-3.5" aria-hidden />
            Ghim
          </Badge>
        ) : null}
        <span className="text-xs text-on-surface-variant">
          {formatDateTime(announcement.published_at)}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-medium tracking-tight text-on-surface">
        {announcement.title}
      </h3>
      <Markdown content={announcement.body_md} className="mt-3" />
    </Card>
  );
}
