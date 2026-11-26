import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminShell } from "@/components/admin/admin-shell";
import type { AccessRequest } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, email } = await requireAdmin();

  const { data } = await supabase.rpc("admin_list_access_requests");
  const pendingRequestCount = ((data as AccessRequest[] | null) ?? []).filter(
    (request) => request.status === "pending",
  ).length;

  return (
    <AdminShell email={email} pendingRequestCount={pendingRequestCount}>
      {children}
    </AdminShell>
  );
}
