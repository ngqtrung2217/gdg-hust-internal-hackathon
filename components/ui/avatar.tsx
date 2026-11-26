import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/text";

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container font-medium text-on-primary-container",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? "Ảnh đại diện"}
          width={size}
          height={size}
          // Google already serves small, cached avatars. Proxying dozens of
          // them through the Next image optimizer on /participants made the
          // list feel slow, so load them directly.
          unoptimized
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
