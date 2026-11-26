import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClass } from "./button";
import { cn } from "@/lib/utils/cn";

export function Pagination({
  page,
  totalPages,
  hrefForPage,
  label = "Phân trang",
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  const previous = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const controlClass = buttonClass({ variant: "outline", size: "md" });
  const disabledClass = cn(controlClass, "pointer-events-none opacity-50");

  return (
    <nav
      aria-label={label}
      className="flex items-center justify-between gap-3 border-t border-outline-variant px-5 py-3"
    >
      {page <= 1 ? (
        <span className={disabledClass} aria-disabled="true">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Trước
        </span>
      ) : (
        <Link href={hrefForPage(previous)} className={controlClass}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Trước
        </Link>
      )}

      <span className="text-sm text-on-surface-variant" aria-current="page">
        Trang {page} / {totalPages}
      </span>

      {page >= totalPages ? (
        <span className={disabledClass} aria-disabled="true">
          Sau
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      ) : (
        <Link href={hrefForPage(next)} className={controlClass}>
          Sau
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
