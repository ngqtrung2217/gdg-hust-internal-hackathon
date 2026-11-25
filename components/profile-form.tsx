"use client";

import { useActionState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { updateProfileAction } from "@/lib/actions/profile";
import { initialActionState } from "@/lib/actions/types";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import { ROLE_OPTIONS } from "@/lib/constants";
import type { Profile, Skill } from "@/types/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { SkillEditor } from "@/components/skill-editor";

export function ProfileForm({
  profile,
  catalog,
  initialSkills,
}: {
  profile: Profile;
  catalog: Skill[];
  initialSkills: { skill_id: string; level: number }[];
}) {
  const [state, formAction] = useActionState(
    updateProfileAction,
    initialActionState,
  );
  useActionToast(state);

  const completeness = Math.round(
    ([
      profile.full_name,
      profile.student_id,
      profile.major,
      profile.cohort,
      profile.headline,
      profile.bio,
      initialSkills.length > 0,
      profile.preferred_roles.length > 0,
      profile.facebook_url || profile.github_url,
    ].filter(Boolean).length /
      9) *
      100,
  );

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {state.message ? (
          <div
            role={state.ok ? "status" : "alert"}
            className={
              state.ok
                ? "flex items-center gap-2 rounded-xl border border-success/30 bg-success-container px-4 py-3 text-sm text-on-success-container"
                : "flex items-center gap-2 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container"
            }
          >
            {state.ok ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : (
              <ShieldCheck className="h-4 w-4" aria-hidden />
            )}
            {state.message}
          </div>
        ) : null}

        <Card className="p-6">
          <h2 className="text-lg font-medium text-on-surface">Thông tin cơ bản</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Email và ảnh đại diện lấy từ Google, không chỉnh sửa tại đây.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Họ và tên"
              htmlFor="full_name"
              error={state.fieldErrors?.full_name}
              className="sm:col-span-2"
            >
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile.full_name}
                autoComplete="name"
                required
              />
            </Field>

            <Field
              label="MSSV"
              htmlFor="student_id"
              error={state.fieldErrors?.student_id}
            >
              <Input
                id="student_id"
                name="student_id"
                defaultValue={profile.student_id ?? ""}
                inputMode="numeric"
                placeholder="2021xxxx"
              />
            </Field>

            <Field
              label="Khóa"
              htmlFor="cohort"
              hint="Ví dụ: K70, K71"
              error={state.fieldErrors?.cohort}
            >
              <Input
                id="cohort"
                name="cohort"
                defaultValue={profile.cohort ?? ""}
                placeholder="K71"
              />
            </Field>

            <Field
              label="Ngành học"
              htmlFor="major"
              error={state.fieldErrors?.major}
              className="sm:col-span-2"
            >
              <Input
                id="major"
                name="major"
                defaultValue={profile.major ?? ""}
                placeholder="Khoa học máy tính"
              />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium text-on-surface">Giới thiệu</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Ngắn gọn, cụ thể. Đội khác đọc phần này để quyết định mời bạn.
          </p>

          <div className="mt-5 space-y-4">
            <Field
              label="Headline"
              htmlFor="headline"
              hint="Một dòng mô tả bạn, tối đa 120 ký tự."
              error={state.fieldErrors?.headline}
            >
              <Input
                id="headline"
                name="headline"
                defaultValue={profile.headline ?? ""}
                placeholder="Frontend · thích build sản phẩm nhanh"
              />
            </Field>

            <Field
              label="Bio"
              htmlFor="bio"
              hint="Tối đa 600 ký tự."
              error={state.fieldErrors?.bio}
            >
              <Textarea
                id="bio"
                name="bio"
                defaultValue={profile.bio ?? ""}
                placeholder="Kinh nghiệm, sở thích, điều bạn muốn làm trong hackathon…"
              />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium text-on-surface">Liên hệ</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Chỉ người đã đăng nhập mới thấy các thông tin này.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Email liên hệ"
              htmlFor="contact_email"
              error={state.fieldErrors?.contact_email}
            >
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                defaultValue={profile.contact_email ?? ""}
                placeholder="ban@example.com"
              />
            </Field>

            <Field
              label="GitHub"
              htmlFor="github_url"
              error={state.fieldErrors?.github_url}
            >
              <Input
                id="github_url"
                name="github_url"
                type="url"
                defaultValue={profile.github_url ?? ""}
                placeholder="https://github.com/..."
              />
            </Field>

            <Field
              label="Facebook"
              htmlFor="facebook_url"
              error={state.fieldErrors?.facebook_url}
              className="sm:col-span-2"
            >
              <Input
                id="facebook_url"
                name="facebook_url"
                type="url"
                defaultValue={profile.facebook_url ?? ""}
                placeholder="https://facebook.com/..."
              />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium text-on-surface">Kỹ năng</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Chọn tối đa 5 kỹ năng từ danh mục BTC. Mức 1 là mới bắt đầu, 5 là
            thành thạo.
          </p>

          <div className="mt-5">
            <SkillEditor catalog={catalog} initial={initialSkills} />
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-on-surface">Role mong muốn</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Chọn tối đa 3. Dùng để đội khác biết bạn phù hợp ở đâu.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role.value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-container has-[:checked]:text-on-primary-container"
                >
                  <input
                    type="checkbox"
                    name="preferred_roles"
                    value={role.value}
                    defaultChecked={profile.preferred_roles.includes(
                      role.value,
                    )}
                    className="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                  />
                  {role.label}
                </label>
              ))}
            </div>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-outline-variant p-4">
            <input
              type="checkbox"
              name="open_to_invites"
              defaultChecked={profile.open_to_invites}
              className="mt-0.5 h-4 w-4 rounded border-outline text-primary focus:ring-primary"
            />
            <span>
              <span className="block text-sm font-medium text-on-surface">
                Đang tìm đội
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-on-surface-variant">
                Hiện hồ sơ của bạn trong danh sách để đội trưởng gửi lời mời.
              </span>
            </span>
          </label>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
              size={56}
            />
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-on-surface">
                {profile.full_name}
              </p>
              <p className="truncate text-xs text-on-surface-variant">
                {profile.email}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={profile.role === "admin" ? "primary" : "neutral"}>
              {profile.role === "admin" ? "BTC / Admin" : "Thí sinh"}
            </Badge>
            {profile.cohort ? <Badge>{profile.cohort}</Badge> : null}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Độ hoàn thiện hồ sơ</span>
              <span className="font-mono tabular-nums">{completeness}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>

          <SubmitButton className="mt-6 w-full" pendingText="Đang lưu…">
            Lưu hồ sơ
          </SubmitButton>
          <p className="mt-3 text-center text-xs leading-5 text-on-surface-variant">
            Thay đổi được lưu ngay và hiển thị cho các đội khác.
          </p>
        </Card>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => window.history.back()}
        >
          Quay lại
        </Button>
      </aside>
    </form>
  );
}
