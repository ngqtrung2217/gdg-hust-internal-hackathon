import { z } from "zod";
import { DEPARTMENT_OPTIONS, MAX_PROFILE_SKILLS } from "@/lib/constants";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DEPARTMENT_VALUES = DEPARTMENT_OPTIONS.map((option) => option.value);
const SUBTEAM_VALUES = DEPARTMENT_OPTIONS.flatMap((option) =>
  option.areas.map((area) => area.value),
);

const httpsUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (value) => value === "" || /^https:\/\/[^\s]+$/i.test(value),
    "URL phải bắt đầu bằng https://",
  );

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Nhập họ và tên")
    .max(120, "Tối đa 120 ký tự"),
  student_id: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (value.length >= 3 && value.length <= 20),
      "MSSV phải từ 3 đến 20 ký tự",
    ),
  major: z.string().trim().max(120, "Tối đa 120 ký tự"),
  cohort: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^K[0-9]{2,3}$/i.test(value),
      "Khóa phải có dạng K70 hoặc K71",
    )
    .transform((value) => value.toUpperCase()),
  contact_email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || EMAIL_RE.test(value),
      "Email liên hệ không hợp lệ",
    ),
  headline: z.string().trim().max(120, "Tối đa 120 ký tự"),
  bio: z.string().trim().max(600, "Tối đa 600 ký tự"),
  facebook_url: httpsUrl,
  github_url: httpsUrl,
  open_to_invites: z.boolean(),
  department: z
    .string()
    .trim()
    .min(1, "Chọn ban")
    .refine(
      (value) => DEPARTMENT_VALUES.some((item) => item === value),
      "Ban không hợp lệ",
    ),
  subteam: z
    .string()
    .trim()
    .min(1, "Chọn mảng")
    .refine(
      (value) => SUBTEAM_VALUES.some((item) => item === value),
      "Mảng không hợp lệ",
    ),
}).superRefine((data, ctx) => {
  const department = DEPARTMENT_OPTIONS.find(
    (option) => option.value === data.department,
  );

  if (!department?.areas.some((area) => area.value === data.subteam)) {
    ctx.addIssue({
      code: "custom",
      path: ["subteam"],
      message: "Mảng không thuộc ban đã chọn",
    });
  }
});

export type ProfileInput = z.infer<typeof profileSchema>;

export type ParsedSkills =
  | { ok: true; ids: string[]; levels: number[] }
  | { ok: false; message: string };

export function parseSkills(raw: FormDataEntryValue | null): ParsedSkills {
  let value: unknown;

  try {
    value = JSON.parse(String(raw ?? "[]"));
  } catch {
    return { ok: false, message: "Danh sách kỹ năng không hợp lệ." };
  }

  if (!Array.isArray(value)) {
    return { ok: false, message: "Danh sách kỹ năng không hợp lệ." };
  }

  if (value.length > MAX_PROFILE_SKILLS) {
    return {
      ok: false,
      message: `Chọn tối đa ${MAX_PROFILE_SKILLS} kỹ năng.`,
    };
  }

  const ids: string[] = [];
  const levels: number[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as { skill_id?: unknown }).skill_id !== "string" ||
      typeof (item as { level?: unknown }).level !== "number"
    ) {
      return { ok: false, message: "Danh sách kỹ năng không hợp lệ." };
    }

    const skillId = (item as { skill_id: string }).skill_id;
    const level = (item as { level: number }).level;

    if (!/^[0-9a-f-]{36}$/i.test(skillId) || level < 1 || level > 5) {
      return { ok: false, message: "Kỹ năng hoặc mức độ không hợp lệ." };
    }

    if (ids.includes(skillId)) {
      return { ok: false, message: "Mỗi kỹ năng chỉ chọn một lần." };
    }

    ids.push(skillId);
    levels.push(Math.round(level));
  }

  return { ok: true, ids, levels };
}
