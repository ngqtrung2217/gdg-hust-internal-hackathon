import { requireUser } from "@/lib/auth/require-user";
import { ProfileForm } from "@/components/profile-form";
import type { ProfileWithSkills, Skill } from "@/types/db";


export default async function ProfilePage() {
  const { supabase, profileId } = await requireUser();

  const [{ data: profiles }, { data: catalog }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "*, profile_skills(skill_id, level, skill:skill_catalog(id, name, category))",
      )
      .eq("id", profileId)
      .limit(1)
      .returns<ProfileWithSkills[]>(),
    supabase
      .from("skill_catalog")
      .select("id, name, category, active, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .returns<Skill[]>(),
  ]);

  const profile = profiles?.[0];

  if (!profile) {
    return (
      <div className="rounded-2xl border border-error/30 bg-error-container p-6 text-sm text-on-error-container">
        Không tìm thấy hồ sơ. Hãy đăng xuất rồi đăng nhập lại.
      </div>
    );
  }

  const initialSkills = (profile.profile_skills ?? [])
    .map((item) => ({
      skill_id: item.skill_id ?? item.skill?.id ?? "",
      level: item.level,
    }))
    .filter((item) => item.skill_id);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Hồ sơ thí sinh</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
          Hồ sơ của bạn
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
          Email và ảnh Google không sửa được.
        </p>
      </header>

      <ProfileForm
        profile={profile}
        catalog={catalog ?? []}
        initialSkills={initialSkills}
      />
    </div>
  );
}
