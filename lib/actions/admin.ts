"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { ActionState } from "./types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const settingsSchema = z.object({
  allowlist_mode: z.boolean(),
  max_team_size: z.number().int().min(3).max(5),
  teams_locked: z.boolean(),
  team_creation_deadline: z.string().trim(),
});

export async function updateSettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const parsed = settingsSchema.safeParse({
    allowlist_mode: formData.get("allowlist_mode") === "on",
    max_team_size: Number(formData.get("max_team_size") ?? 5),
    teams_locked: formData.get("teams_locked") === "on",
    team_creation_deadline: String(formData.get("team_creation_deadline") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: "Cấu hình không hợp lệ." };
  }

  let deadline: string | null = null;
  if (parsed.data.team_creation_deadline) {
    const date = new Date(parsed.data.team_creation_deadline);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, message: "Deadline không hợp lệ." };
    }
    deadline = date.toISOString();
  }

  const { error } = await supabase.rpc("admin_update_settings", {
    p_allowlist_mode: parsed.data.allowlist_mode,
    p_max_team_size: parsed.data.max_team_size,
    p_team_creation_deadline: deadline,
    p_teams_locked: parsed.data.teams_locked,
  });

  if (error) {
    return { ok: false, message: "Không lưu được cấu hình." };
  }

  revalidatePath("/admin");
  revalidatePath("/overview");
  revalidatePath("/team");
  revalidatePath("/teams");

  return { ok: true, message: "Đã lưu cấu hình." };
}

type AllowlistImportRow = {
  email: string;
  full_name: string | null;
  student_id: string | null;
  major: string | null;
  cohort: string | null;
  role: "participant" | "admin";
  active: boolean;
};

function parseAllowlistCsv(text: string):
  | { ok: true; rows: AllowlistImportRow[] }
  | { ok: false; message: string } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { ok: false, message: "Chưa có dữ liệu để import." };
  }

  const rows: AllowlistImportRow[] = [];
  const start = lines[0].toLowerCase().startsWith("email") ? 1 : 0;

  for (let index = start; index < lines.length; index += 1) {
    if (rows.length >= 500) {
      return { ok: false, message: "Tối đa 500 dòng mỗi lần import." };
    }

    const parts = lines[index].split(",").map((part) => part.trim());
    const [email, fullName, studentId, major, cohort, role, active] = parts;
    const lineNumber = index + 1;

    if (!email || !EMAIL_RE.test(email)) {
      return { ok: false, message: `Dòng ${lineNumber}: email không hợp lệ.` };
    }

    if (cohort && !/^K[0-9]{2,3}$/i.test(cohort)) {
      return {
        ok: false,
        message: `Dòng ${lineNumber}: khóa phải có dạng K70 hoặc K71.`,
      };
    }

    const normalizedRole = (role ?? "").toLowerCase();
    if (normalizedRole && normalizedRole !== "participant" && normalizedRole !== "admin") {
      return {
        ok: false,
        message: `Dòng ${lineNumber}: role chỉ nhận participant hoặc admin.`,
      };
    }

    rows.push({
      email: email.toLowerCase(),
      full_name: fullName || null,
      student_id: studentId || null,
      major: major || null,
      cohort: cohort ? cohort.toUpperCase() : null,
      role: normalizedRole === "admin" ? "admin" : "participant",
      active: !["false", "0", "no", "off"].includes(
        (active ?? "true").toLowerCase(),
      ),
    });
  }

  if (rows.length === 0) {
    return { ok: false, message: "Không có dòng hợp lệ để import." };
  }

  return { ok: true, rows };
}

export async function importAllowlistAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const csv = String(formData.get("csv") ?? "");
  const parsed = parseAllowlistCsv(csv);

  if (!parsed.ok) {
    return { ok: false, message: parsed.message };
  }

  const { data, error } = await supabase.rpc("admin_import_allowlist", {
    p_rows: parsed.rows,
  });

  if (error) {
    return { ok: false, message: "Không import được danh sách." };
  }

  revalidatePath("/admin");
  revalidatePath("/overview");

  return { ok: true, message: `Đã import ${data ?? parsed.rows.length} dòng.` };
}

const announcementSchema = z.object({
  title: z.string().trim().min(1).max(160),
  body_md: z.string().trim().min(1).max(10000),
  pinned: z.boolean(),
});

export async function createAnnouncementAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body_md: formData.get("body_md"),
    pinned: formData.get("pinned") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Tiêu đề và nội dung là bắt buộc; nội dung tối đa 10.000 ký tự.",
    };
  }

  const { error } = await supabase.rpc("admin_create_announcement", {
    p_title: parsed.data.title,
    p_body_md: parsed.data.body_md,
    p_pinned: parsed.data.pinned,
  });

  if (error) {
    return { ok: false, message: "Không đăng được thông báo." };
  }

  revalidatePath("/admin");
  revalidatePath("/overview");

  return { ok: true, message: "Đã đăng thông báo." };
}

export async function deleteAnnouncementAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));

  if (!id.success) redirect("/admin?tab=announcements&error=1");

  const { error } = await supabase.rpc("admin_delete_announcement", {
    p_id: id.data,
  });

  if (error) redirect("/admin?tab=announcements&error=1");

  revalidatePath("/admin");
  revalidatePath("/overview");
  redirect("/admin?tab=announcements&ok=1");
}

export async function setTeamLockedAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const teamId = z.string().uuid().safeParse(formData.get("team_id"));

  if (!teamId.success) redirect("/admin?tab=teams&error=1");

  const locked = formData.get("locked") === "true";

  const { error } = await supabase.rpc("admin_set_team_locked", {
    p_team_id: teamId.data,
    p_locked: locked,
  });

  if (error) redirect("/admin?tab=teams&error=1");

  revalidatePath("/admin");
  revalidatePath("/teams");
  redirect("/admin?tab=teams&ok=1");
}

export async function saveAllowlistAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const studentId = String(formData.get("student_id") ?? "").trim();
  const major = String(formData.get("major") ?? "").trim();
  const cohort = String(formData.get("cohort") ?? "").trim().toUpperCase();
  const role = String(formData.get("role") ?? "participant");
  const active = formData.get("active") === "on";

  if (!EMAIL_RE.test(email)) {
    redirect("/admin?tab=allowlist&error=1");
  }

  if (cohort && !/^K[0-9]{2,3}$/.test(cohort)) {
    redirect("/admin?tab=allowlist&error=1");
  }

  if (role !== "admin" && role !== "participant") {
    redirect("/admin?tab=allowlist&error=1");
  }

  const { error } = await supabase.rpc("admin_upsert_allowlist", {
    p_email: email,
    p_full_name: fullName || null,
    p_student_id: studentId || null,
    p_major: major || null,
    p_cohort: cohort || null,
    p_role: role,
    p_active: active,
  });

  if (error) {
    redirect("/admin?tab=allowlist&error=1");
  }

  revalidatePath("/admin");
  redirect("/admin?tab=allowlist&ok=1");
}

export async function deleteAllowlistAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    redirect("/admin?tab=allowlist&error=1");
  }

  const { error } = await supabase.rpc("admin_delete_allowlist", {
    p_email: email,
  });

  if (error) {
    redirect("/admin?tab=allowlist&error=1");
  }

  revalidatePath("/admin");
  redirect("/admin?tab=allowlist&ok=1");
}

export async function deleteTeamAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const teamId = z.string().uuid().safeParse(formData.get("team_id"));

  if (!teamId.success) {
    redirect("/admin?tab=teams&error=1");
  }

  const { error } = await supabase.rpc("admin_delete_team", {
    p_team_id: teamId.data,
  });

  if (error) {
    redirect("/admin?tab=teams&error=1");
  }

  revalidatePath("/admin");
  revalidatePath("/teams");
  revalidatePath("/team");
  redirect("/admin?tab=teams&ok=1");
}

export async function updateAnnouncementAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));

  if (!id.success) {
    return { ok: false, message: "Thông báo không hợp lệ." };
  }

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body_md: formData.get("body_md"),
    pinned: formData.get("pinned") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Tiêu đề và nội dung là bắt buộc; nội dung tối đa 10.000 ký tự.",
    };
  }

  const { error } = await supabase.rpc("admin_update_announcement", {
    p_id: id.data,
    p_title: parsed.data.title,
    p_body_md: parsed.data.body_md,
    p_pinned: parsed.data.pinned,
  });

  if (error) {
    return { ok: false, message: "Không lưu được thông báo." };
  }

  revalidatePath("/admin");
  revalidatePath("/overview");

  return { ok: true, message: "Đã cập nhật thông báo." };
}

export async function adminTransferLeaderAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const teamId = z.string().uuid().safeParse(formData.get("team_id"));
  const newLeaderId = z.string().uuid().safeParse(formData.get("new_leader_id"));

  if (!teamId.success || !newLeaderId.success) {
    redirect("/admin?tab=teams&error=1");
  }

  const { error } = await supabase.rpc("admin_transfer_team_leadership", {
    p_team_id: teamId.data,
    p_new_leader_id: newLeaderId.data,
  });

  if (error) {
    redirect("/admin?tab=teams&error=1");
  }

  revalidatePath("/admin");
  revalidatePath("/team");
  redirect("/admin?tab=teams&ok=1");
}

export async function adminRemoveMemberAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const teamId = z.string().uuid().safeParse(formData.get("team_id"));
  const userId = z.string().uuid().safeParse(formData.get("user_id"));

  if (!teamId.success || !userId.success) {
    redirect("/admin?tab=teams&error=1");
  }

  const { error } = await supabase.rpc("admin_remove_team_member", {
    p_team_id: teamId.data,
    p_user_id: userId.data,
  });

  if (error) {
    redirect("/admin?tab=teams&error=1");
  }

  revalidatePath("/admin");
  revalidatePath("/team");
  revalidatePath("/teams");
  revalidatePath("/participants");
  redirect("/admin?tab=teams&ok=1");
}

export async function approveAccessRequestAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const role = String(formData.get("role") ?? "participant");

  if (!id.success || (role !== "participant" && role !== "admin")) {
    redirect("/admin?tab=requests&error=1");
  }

  const { error } = await supabase.rpc("admin_approve_access_request", {
    p_id: id.data,
    p_role: role,
  });

  if (error) {
    redirect("/admin?tab=requests&error=1");
  }

  revalidatePath("/admin");
  redirect("/admin?tab=requests&ok=1");
}

export async function rejectAccessRequestAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));

  if (!id.success) {
    redirect("/admin?tab=requests&error=1");
  }

  const { error } = await supabase.rpc("admin_reject_access_request", {
    p_id: id.data,
  });

  if (error) {
    redirect("/admin?tab=requests&error=1");
  }

  revalidatePath("/admin");
  redirect("/admin?tab=requests&ok=1");
}

export async function adminSetRecruitingAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const teamId = z.string().uuid().safeParse(formData.get("team_id"));
  const recruiting = formData.get("recruiting") === "true";

  if (!teamId.success) {
    redirect("/admin?tab=teams&error=1");
  }

  const { error } = await supabase.rpc("set_team_recruiting", {
    p_team_id: teamId.data,
    p_recruiting: recruiting,
  });

  if (error) {
    redirect("/admin?tab=teams&error=1");
  }

  revalidatePath("/admin");
  revalidatePath("/team");
  revalidatePath("/teams");
  redirect("/admin?tab=teams&ok=1");
}
