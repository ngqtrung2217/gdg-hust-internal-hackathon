"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { updateProfileAction } from "@/lib/actions/profile";
import { initialActionState } from "@/lib/actions/types";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import { DEPARTMENT_OPTIONS } from "@/lib/constants";
import type { Department, Profile, Skill, Subteam } from "@/types/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
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

  const [department, setDepartment] = useState<Department | "">(
    profile.department ?? "",
  );
  const [subteam, setSubteam] = useState<Subteam | "">(profile.subteam ?? "");

  const selectedDepartment = DEPARTMENT_OPTIONS.find(
    (option) => option.value === department,
  );
  const departmentLabel = DEPARTMENT_OPTIONS.find(
    (option) => option.value === profile.department,
  )?.label;
  const subteamLabel = DEPARTMENT_OPTIONS.find(
    (option) => option.value === profile.department,
  )?.areas.find((area) => area.value === profile.subteam)?.label;

  const completeness = Math.round(
    ([
      profile.full_name,
      profile.student_id,
      profile.major,
      profile.cohort,
      profile.headline,
      profile.bio,
      initialSkills.length > 0,
      profile.department && profile.subteam,
      profile.facebook_url || profile.github_url,
    ].filter(Boolean).length /
      9) *
      100,
  );

  function changeDepartment(value: Department | "") {
    setDepartment(value);

    const areas =
      DEPARTMENT_OPTIONS.find((option) => option.value === value)?.areas ?? [];
    if (!areas.some((area) => area.value === subteam)) {
      setSubteam("");
    }
  }

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

            <Field
              label="Ban"
              htmlFor="department"
              hint="Ban của bạn trong GDG-HUST."
              error={state.fieldErrors?.department}
            >
              <Select
                id="department"
                name="department"
                value={department}
                onChange={(event) =>
                  changeDepartment(event.target.value as Department | "")
                }
                required
              >
                <option value="" disabled>
                  Chọn ban
                </option>
                {DEPARTMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Mảng"
              htmlFor="subteam"
              hint={department ? undefined : "Chọn ban trước."}
              error={state.fieldErrors?.subteam}
            >
              <Select
                id="subteam"
                name="subteam"
                value={subteam}
                onChange={(event) =>
                  setSubteam(event.target.value as Subteam | "")
                }
                disabled={!department}
                required
              >
                <option value="" disabled>
                  Chọn mảng
                </option>
                {(selectedDepartment?.areas ?? []).map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <p className="mt-4 rounded-lg bg-surface-container px-3 py-2 text-xs leading-5 text-on-surface-variant">
            Đội gồm 3–5 người, tối đa 3 Developer và 1–2 Marcom/Operation.
          </p>
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
            {departmentLabel ? (
              <Badge tone="primary">{departmentLabel}</Badge>
            ) : null}
            {subteamLabel ? <Badge>{subteamLabel}</Badge> : null}
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
