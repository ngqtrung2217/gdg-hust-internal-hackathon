import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import type { Profile } from "@/types/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { GoogleStripe } from "@/components/google-stripe";
import { NavTabs } from "@/components/nav-tabs";
import { signOutAction } from "@/lib/actions/auth";

export function AppShell({
  profile,
  isAdmin,
  children,
}: {
  profile: Profile;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/90 backdrop-blur">
        <GoogleStripe />
        <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark href="/overview" />

          <div className="hidden flex-1 md:block">
            <NavTabs />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-surface-container sm:flex"
            >
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name}
                size={32}
              />
              <span className="max-w-32 truncate text-sm font-medium text-on-surface">
                {profile.full_name || "Thí sinh"}
              </span>
              {isAdmin ? <Badge tone="primary">BTC</Badge> : null}
            </Link>

            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <Settings className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Quản trị</span>
              </Link>
            ) : null}

            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </form>
          </div>
        </div>

        <div className="w-full px-4 pb-2 md:hidden sm:px-6">
          <NavTabs />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>

      <footer className="border-t border-outline-variant">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-4 py-6 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>GDG-HUST Internal Hackathon 2026</span>
          <span>Dữ liệu chỉ dành cho thí sinh và BTC.</span>
        </div>
      </footer>
    </div>
  );
}
