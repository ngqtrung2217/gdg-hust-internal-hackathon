import { requireUser } from "@/lib/auth/require-user";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import type { Profile } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, profileId } = await requireUser();

  const [{ data: profiles }, { data: isAdmin }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .limit(1)
      .returns<Profile[]>(),
    supabase.rpc("is_admin"),
  ]);

  const profile = profiles?.[0];

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-medium text-on-surface">
          Chưa tìm thấy hồ sơ
        </h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          Phiên đăng nhập đã hết hạn hoặc hồ sơ chưa được khởi tạo. Hãy đăng
          nhập lại bằng Google.
        </p>
        <form action={signOutAction} className="mt-6">
          <Button type="submit" variant="outline">
            Đăng xuất và thử lại
          </Button>
        </form>
      </main>
    );
  }

  return (
    <AppShell profile={profile} isAdmin={Boolean(isAdmin)}>
      {children}
    </AppShell>
  );
}
