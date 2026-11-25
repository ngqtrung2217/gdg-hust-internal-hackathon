"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/overview", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/team", label: "Đội của tôi", icon: Users },
  { href: "/teams", label: "Tìm đội", icon: Search },
  { href: "/participants", label: "Tìm đồng đội", icon: UsersRound },
  { href: "/profile", label: "Hồ sơ", icon: UserRound },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="flex gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
