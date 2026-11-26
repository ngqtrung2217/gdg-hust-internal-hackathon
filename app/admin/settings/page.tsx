import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { SettingsForm } from "@/components/admin/settings-form";
import type { AppSettings } from "@/types/db";

export const metadata: Metadata = { title: "Cấu hình" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("app_settings")
    .select("allowlist_mode, max_team_size, team_creation_deadline, teams_locked")
    .eq("id", 1)
    .limit(1)
    .returns<AppSettings[]>();

  const settings: AppSettings = data?.[0] ?? {
    allowlist_mode: true,
    max_team_size: 5,
    team_creation_deadline: null,
    teams_locked: false,
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">BTC / Admin</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
          Cấu hình
        </h1>
      </header>

      <SettingsForm settings={settings} />
    </div>
  );
}
