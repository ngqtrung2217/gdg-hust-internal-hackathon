import { cn } from "@/lib/utils/cn";

export function GoogleStripe({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-1 w-full bg-[linear-gradient(90deg,#4285F4_0_25%,#EA4335_25%_50%,#FBBC05_50%_75%,#34A853_75%_100%)]",
        className,
      )}
    />
  );
}
