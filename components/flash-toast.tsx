"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function FlashToast({
  ok,
  error,
}: {
  ok?: string;
  error?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ok && !error) return;

    if (ok) {
      toast.success(ok === "1" ? "Thao tác thành công." : ok);
    }
    if (error) {
      toast.error(error === "1" ? "Thao tác không thành công." : error);
    }

    router.replace(pathname, { scroll: false });
  }, [ok, error, pathname, router]);

  return null;
}
