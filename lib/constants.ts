import type {
  Department,
  JoinRequestStatus,
  Subteam,
  TeamStatus,
} from "@/types/db";

export type DepartmentOption = {
  value: Department;
  label: string;
  areas: { value: Subteam; label: string }[];
};

export const DEPARTMENT_OPTIONS: DepartmentOption[] = [
  {
    value: "developer",
    label: "Developer",
    areas: [
      { value: "data-ai", label: "Data & AI" },
      { value: "web", label: "Web" },
      { value: "mobile", label: "Mobile" },
    ],
  },
  {
    value: "marcom",
    label: "Marcom",
    areas: [
      { value: "content", label: "Content" },
      { value: "design", label: "Design" },
      { value: "photo", label: "Photo" },
    ],
  },
  {
    value: "operation",
    label: "Operation",
    areas: [
      { value: "event", label: "Event" },
      { value: "human-resources", label: "Human Resources" },
      { value: "partnership", label: "Partnership" },
    ],
  },
];

export const DEPARTMENT_LABEL: Record<Department, string> = {
  developer: "Developer",
  marcom: "Marcom",
  operation: "Operation",
};

export const SUBTEAM_LABEL: Record<Subteam, string> = Object.fromEntries(
  DEPARTMENT_OPTIONS.flatMap((department) =>
    department.areas.map((area) => [area.value, area.label]),
  ),
) as Record<Subteam, string>;

export const MAX_DEVELOPERS_PER_TEAM = 3;
export const MAX_MARCOM_OPERATION_PER_TEAM = 2;

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
