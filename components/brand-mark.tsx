import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function BrandMark({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="GDG on Campus HUST — Internal Hackathon 2026"
    >
      <Image
        src="/gdg-logo.svg"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7"
        priority
      />
      <span className="leading-tight">
        <span className="block text-[13px] font-medium tracking-tight text-on-surface">
          GDG on Campus · HUST
        </span>
        {compact ? null : (
          <span className="block text-[11px] text-on-surface-variant">
            Internal Hackathon 2026
          </span>
        )}
      </span>
    </Link>
  );
}
