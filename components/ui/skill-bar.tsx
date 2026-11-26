import { cn } from "@/lib/utils/cn";

// One accent per catalog category. The level text stays visible, so color is
// never the only signal. Unknown/future categories fall back to primary.
const CATEGORY_BAR: Record<string, string> = {
  engineering: "bg-brand-blue",
  data: "bg-brand-green",
  design: "bg-brand-red",
  product: "bg-brand-yellow",
  marketing: "bg-warning",
  operations: "bg-outline",
};

export function SkillBar({
  name,
  level,
  category,
  className,
}: {
  name: string;
  level: number;
  category?: string | null;
  className?: string;
}) {
  const safeLevel = Math.max(0, Math.min(5, level));
  const width = `${(safeLevel / 5) * 100}%`;
  const barColor = (category && CATEGORY_BAR[category]) || "bg-primary";

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
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            barColor,
          )}
          style={{ width }}
        />
      </div>
    </div>
  );
}
