import { cn } from "@/lib/utils/cn";

export function SkillBar({
  name,
  level,
  className,
}: {
  name: string;
  level: number;
  className?: string;
}) {
  const safeLevel = Math.max(0, Math.min(5, level));
  const width = `${(safeLevel / 5) * 100}%`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-on-surface">{name}</span>
        <span className="shrink-0 font-mono text-xs tabular-nums text-on-surface-variant">
          {safeLevel}/5
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width }}
        />
      </div>
    </div>
  );
}
