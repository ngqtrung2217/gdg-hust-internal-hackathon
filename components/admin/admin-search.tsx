import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminSearch({
  action,
  q = "",
  placeholder,
  clearHref,
}: {
  action: string;
  q?: string;
  placeholder: string;
  clearHref: string;
}) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="flex flex-wrap items-center gap-2"
    >
      <div className="relative w-full sm:w-80">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          aria-hidden
        />
        <Input
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-10 pl-9"
        />
      </div>
      <Button type="submit" variant="outline" size="md">
        Tìm
      </Button>
      {q ? (
        <Link
          href={clearHref}
          className="text-sm font-medium text-primary hover:underline"
        >
          Xóa lọc
        </Link>
      ) : null}
    </form>
  );
}
