"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

const items = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/settings", label: "Cấu hình", icon: Settings },
  { href: "/admin/allowlist", label: "Danh sách", icon: ShieldCheck },
  { href: "/admin/requests", label: "Yêu cầu", icon: Inbox },
  { href: "/admin/participants", label: "Thí sinh", icon: UserCheck },
  { href: "/admin/announcements", label: "Thông báo", icon: Megaphone },
  { href: "/admin/teams", label: "Đội thi", icon: Users },
];

const baseClass =
  "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors";
const activeClass = "bg-primary-container text-on-primary-container";
const idleClass =
  "text-on-surface-variant hover:bg-surface-container hover:text-on-surface";

export function AdminNav({
  pendingRequestCount,
}: {
  pendingRequestCount: number;
}) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Keep the current item visible when the nav overflows horizontally.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav
      aria-label="Quản trị"
      className="flex gap-1 overflow-x-auto rounded-2xl border border-outline-variant bg-surface p-1.5 lg:flex-col"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            ref={active ? activeRef : undefined}
            aria-current={active ? "page" : undefined}
            className={`${baseClass} ${active ? activeClass : idleClass}`}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden />
            {item.label}
            {item.href === "/admin/requests" && pendingRequestCount > 0 ? (
              <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-error-container px-1.5 py-0.5 text-[10px] font-medium text-on-error-container">
                {pendingRequestCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
