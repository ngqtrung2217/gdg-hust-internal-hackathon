"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { parseSkills, profileSchema } from "@/lib/validation/profile";
import type { ActionState } from "./types";

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function fieldErrorsFromIssues(
  issues: { path: PropertyKey[]; message: string }[],
) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export async function updateProfileAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, profileId } = await requireUser();

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    student_id: formData.get("student_id"),
    major: formData.get("major"),
    cohort: formData.get("cohort"),
    contact_email: formData.get("contact_email"),
    headline: formData.get("headline"),
    bio: formData.get("bio"),
    facebook_url: formData.get("facebook_url"),
    github_url: formData.get("github_url"),
    open_to_invites: formData.get("open_to_invites") === "on",
    preferred_roles: formData.getAll("preferred_roles").map(String),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Kiểm tra lại các trường được đánh dấu.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const skills = parseSkills(formData.get("skills"));
  if (!skills.ok) {
    return { ok: false, message: skills.message };
  }

  const data = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      student_id: nullable(data.student_id),
      major: nullable(data.major),
      cohort: nullable(data.cohort),
      contact_email: nullable(data.contact_email),
      headline: nullable(data.headline),
      bio: nullable(data.bio),
      facebook_url: nullable(data.facebook_url),
      github_url: nullable(data.github_url),
      open_to_invites: data.open_to_invites,
      preferred_roles: data.preferred_roles,
    })
    .eq("id", profileId);

  if (error) {
    return {
      ok: false,
      message: "Không lưu được hồ sơ. Vui lòng kiểm tra lại dữ liệu.",
    };
  }

  const { error: skillsError } = await supabase.rpc("set_profile_skills", {
    p_skill_ids: skills.ids,
    p_levels: skills.levels,
  });

  if (skillsError) {
    return {
      ok: false,
      message: "Hồ sơ đã lưu nhưng kỹ năng chưa lưu được. Thử lại.",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/participants");
  revalidatePath("/teams");

  return { ok: true, message: "Đã lưu hồ sơ." };
}
