"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ExternalLink, Eye, UserPlus, X } from "lucide-react";
import { inviteToTeamAction } from "@/lib/actions/team";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SkillBar } from "@/components/ui/skill-bar";
import { SubmitButton } from "@/components/ui/submit-button";
import { DEPARTMENT_LABEL, SUBTEAM_LABEL } from "@/lib/constants";
import type { ProfileWithSkills } from "@/types/db";

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-on-surface-variant">{label}</dt>
      <dd className="mt-0.5 break-words text-on-surface">{value || "—"}</dd>
    </div>
  );
}

export function ParticipantCard({
  profile,
  canInvite,
  alreadyInvited,
}: {
  profile: ProfileWithSkills;
  canInvite: boolean;
  alreadyInvited: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const skills = (profile.profile_skills ?? []).filter((item) => item.skill);
  const department = profile.department
    ? DEPARTMENT_LABEL[profile.department]
    : null;
  const area = profile.subteam ? SUBTEAM_LABEL[profile.subteam] : null;
  const contactLine =
    [profile.major, profile.cohort].filter(Boolean).join(" · ") ||
    "Chưa cập nhật thông tin";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [open]);

  function close() {
    dialogRef.current?.close();
    setOpen(false);
  }

  function inviteForm(size: "sm" | "md") {
    return (
      <form action={inviteToTeamAction}>
        <input type="hidden" name="invitee_id" value={profile.id} />
        <SubmitButton size={size} pendingText="Đang mời…">
          <UserPlus className="h-4 w-4" aria-hidden />
          Mời vào đội
        </SubmitButton>
      </form>
    );
  }

  return (
    <>
      <Card className="flex flex-col p-5">
        <div className="flex items-start gap-3">
          <Avatar src={profile.avatar_url} name={profile.full_name} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-medium text-on-surface">
              {profile.full_name}
            </h2>
            <p className="truncate text-xs text-on-surface-variant">
              {contactLine}
            </p>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-on-surface-variant">
              {profile.headline || "Chưa có headline."}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {department ? (
            <Badge tone="primary">{department}</Badge>
          ) : (
            <Badge tone="warning">Chưa chọn ban</Badge>
          )}
          {area ? <Badge tone="neutral">{area}</Badge> : null}
        </div>

        {skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 3).map((item) => (
              <Badge key={item.skill_id} tone="outline">
                {item.skill?.name ?? "Kỹ năng"} · {item.level}/5
              </Badge>
            ))}
            {skills.length > 3 ? (
              <Badge tone="neutral">+{skills.length - 3}</Badge>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-xs text-on-surface-variant">
            Chưa chọn kỹ năng.
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-outline-variant pt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Eye className="h-4 w-4" aria-hidden />
            Xem chi tiết
          </Button>

          {alreadyInvited ? (
            <Badge tone="warning" className="ml-auto">
              Đã mời
            </Badge>
          ) : canInvite ? (
            <div className="ml-auto">{inviteForm("sm")}</div>
          ) : null}
        </div>
      </Card>

      {open ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const outside =
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom;
            if (outside) close();
          }}
          className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-outline-variant bg-surface p-0 text-left text-on-surface shadow-elevation-3 backdrop:bg-scrim"
        >
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-5 sm:p-6">
            <div className="flex min-w-0 items-start gap-3">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name}
                size={56}
              />
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="truncate text-lg font-medium text-on-surface"
                >
                  {profile.full_name}
                </h2>
                <p className="truncate text-xs text-on-surface-variant">
                  {profile.email}
                </p>
                {profile.headline ? (
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    {profile.headline}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {department ? (
                    <Badge tone="primary">{department}</Badge>
                  ) : (
                    <Badge tone="warning">Chưa chọn ban</Badge>
                  )}
                  {area ? <Badge tone="neutral">{area}</Badge> : null}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Đóng"
              onClick={close}
              className="h-11 w-11 shrink-0 p-0"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {profile.bio ? (
              <section>
                <h3 className="text-sm font-medium text-on-surface">
                  Giới thiệu
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-on-surface-variant">
                  {profile.bio}
                </p>
              </section>
            ) : null}

            <section>
              <h3 className="text-sm font-medium text-on-surface">Kỹ năng</h3>
              {skills.length > 0 ? (
                <div className="mt-2 space-y-3">
                  {skills.slice(0, 5).map((item) => (
                    <SkillBar
                      key={item.skill_id}
                      name={item.skill?.name ?? "Kỹ năng"}
                      level={item.level}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-on-surface-variant">
                  Chưa chọn kỹ năng.
                </p>
              )}
            </section>

            <section>
              <h3 className="text-sm font-medium text-on-surface">Thông tin</h3>
              <dl className="mt-2 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <InfoRow label="MSSV" value={profile.student_id} />
                <InfoRow label="Ngành" value={profile.major} />
                <InfoRow label="Khóa" value={profile.cohort} />
                <InfoRow label="Ban" value={department} />
                <InfoRow label="Nhóm" value={area} />
                <InfoRow label="Email liên hệ" value={profile.contact_email} />
              </dl>
            </section>

            {profile.facebook_url || profile.github_url ? (
              <section>
                <h3 className="text-sm font-medium text-on-surface">
                  Liên kết
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.facebook_url ? (
                    <a
                      href={profile.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      Facebook
                    </a>
                  ) : null}
                  {profile.github_url ? (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      GitHub
                    </a>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-outline-variant p-5 sm:flex-row sm:items-center sm:justify-end sm:p-6">
            <Button type="button" variant="outline" onClick={close}>
              Đóng
            </Button>
            {alreadyInvited ? (
              <Badge tone="warning">Đã mời</Badge>
            ) : canInvite ? (
              inviteForm("md")
            ) : null}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
