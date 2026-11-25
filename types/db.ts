export type AppRole = "participant" | "admin";
export type TeamStatus = "open" | "full" | "locked" | "archived";
export type TeamMemberRole = "leader" | "member";
export type JoinRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export type PreferredRole =
  | "frontend"
  | "backend"
  | "mobile"
  | "ai-ml"
  | "data"
  | "design"
  | "product"
  | "devops"
  | "other";

export type Department = "developer" | "marcom" | "operation";

export type Subteam =
  | "data-ai"
  | "web"
  | "mobile"
  | "content"
  | "design"
  | "photo"
  | "event"
  | "human-resources"
  | "partnership";

export interface Profile {
  id: string;
  email: string;
  contact_email: string | null;
  full_name: string;
  student_id: string | null;
  major: string | null;
  cohort: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  preferred_roles: PreferredRole[];
  facebook_url: string | null;
  github_url: string | null;
  open_to_invites: boolean;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string | null;
  active: boolean;
  sort_order: number;
}

export interface ProfileSkill {
  skill_id: string;
  level: number;
  skill: Pick<Skill, "id" | "name" | "category"> | null;
}

export interface ProfileWithSkills extends Profile {
  profile_skills?: ProfileSkill[];
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  joined_at: string;
  profile?: Pick<
    Profile,
    "id" | "full_name" | "email" | "avatar_url" | "major" | "cohort" | "headline"
  > | null;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  leader_id: string;
  max_members: number;
  status: TeamStatus;
  invite_code: string;
  created_at: string;
  updated_at: string;
  leader?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  team_members?: Pick<TeamMember, "user_id" | "role">[];
}

export interface JoinRequest {
  id: string;
  team_id: string;
  user_id: string;
  message: string | null;
  status: JoinRequestStatus;
  created_at: string;
  decided_at: string | null;
  profile?: Pick<
    Profile,
    "id" | "full_name" | "email" | "avatar_url" | "major" | "cohort" | "headline"
  > | null;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  inviter_id: string;
  invitee_id: string;
  message: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  invitee?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null;
  team?: Pick<Team, "id" | "name"> | null;
}

export interface Announcement {
  id: string;
  title: string;
  body_md: string;
  pinned: boolean;
  published_at: string;
}

export interface AppSettings {
  allowlist_mode: boolean;
  max_team_size: number;
  team_creation_deadline: string | null;
  teams_locked: boolean;
}

export interface AllowlistRow {
  email: string;
  full_name: string | null;
  student_id: string | null;
  major: string | null;
  cohort: string | null;
  role: AppRole;
  active: boolean;
  claimed: boolean;
  imported_at: string;
}
