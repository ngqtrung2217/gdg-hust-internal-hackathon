import type { Profile, TeamStatus } from "./db";

export type AdminTeam = {
  id: string;
  name: string;
  status: TeamStatus;
  recruiting: boolean;
  max_members: number;
  code: string;
  created_at: string;
  leader_id: string;
  leader: Pick<Profile, "full_name" | "email"> | null;
  team_members: {
    user_id: string;
    role: "leader" | "member";
    profile: { full_name: string; email: string } | null;
  }[];
};

export type AdminProfile = Profile & {
  team_members: { team: { name: string } | null }[];
};

export type AccessRequest = {
  id: string;
  email: string;
  google_sub: string | null;
  full_name: string | null;
  avatar_url: string | null;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
};
