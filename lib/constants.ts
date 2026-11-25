import type {
  JoinRequestStatus,
  PreferredRole,
  TeamStatus,
} from "@/types/db";

export const ROLE_OPTIONS: { value: PreferredRole; label: string }[] = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "mobile", label: "Mobile" },
  { value: "ai-ml", label: "AI / ML" },
  { value: "data", label: "Data" },
  { value: "design", label: "Design" },
  { value: "product", label: "Product" },
  { value: "devops", label: "DevOps" },
  { value: "other", label: "Khác" },
];

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  open: "Đang tuyển",
  full: "Đã đủ",
  locked: "Đã khóa",
  archived: "Lưu trữ",
};

export const REQUEST_STATUS_LABEL: Record<JoinRequestStatus, string> = {
  pending: "Chờ duyệt",
  accepted: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã huỷ",
};

export const SKILL_LEVEL_LABEL: Record<number, string> = {
  1: "Mới bắt đầu",
  2: "Cơ bản",
  3: "Khá",
  4: "Tốt",
  5: "Thành thạo",
};

export const MAX_PROFILE_SKILLS = 5;

export const INVITE_LINK_DAYS = 7;
