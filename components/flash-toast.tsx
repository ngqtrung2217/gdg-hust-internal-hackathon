"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";

export function FlashToast({
  ok,
  error,
}: {
  ok?: string;
  error?: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!ok && !error) return;

    if (ok) {
      toast.success(ok === "1" ? "Thao tác thành công." : ok);
    }
    if (error) {
      toast.error(error === "1" ? "Thao tác không thành công." : error);
    }

    // Strip the flash params without a router navigation: router.replace()
    // re-ran the whole server render (extra Supabase round trips) and dropped
    // unrelated params such as the admin `tab`.
    const params = new URLSearchParams(window.location.search);
    params.delete("ok");
    params.delete("error");
    const query = params.toString();

    window.history.replaceState(
      null,
      "",
      `${pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, [ok, error, pathname]);

  return null;
}
