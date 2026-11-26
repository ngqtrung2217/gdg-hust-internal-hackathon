import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export type AdminFilterOption = { value: string; label: string };

export type AdminFilter = {
  name: string;
  label: string;
  value: string;
  options: AdminFilterOption[];
};

export function AdminSearch({
  action,
  q = "",
  placeholder,
  clearHref,
  filters = [],
  showSearch = true,
}: {
  action: string;
  q?: string;
  placeholder: string;
  clearHref: string;
  filters?: AdminFilter[];
  showSearch?: boolean;
}) {
  const dirty = Boolean(q) || filters.some((filter) => filter.value);

  return (
    <form
      action={action}
      method="get"
      role="search"
      className="flex flex-wrap items-end gap-2"
    >
      {showSearch ? (
        <div className="relative w-full sm:w-72">
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
      ) : null}

      {filters.map((filter) => (
        <label key={filter.name} className="flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant">
            {filter.label}
          </span>
          <Select
            name={filter.name}
            defaultValue={filter.value}
            className="h-10 w-44 text-sm"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      ))}

      <Button type="submit" variant="outline" size="md">
        Lọc
      </Button>

      {dirty ? (
        <Link
          href={clearHref}
          className="pb-2.5 text-sm font-medium text-primary hover:underline"
        >
          Xóa lọc
        </Link>
      ) : null}
    </form>
  );
}
