"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { ActionState } from "@/lib/actions/types";

export function useActionToast(state: ActionState) {
  const router = useRouter();

  useEffect(() => {
    if (!state.message) return;

    if (state.ok) {
      toast.success(state.message);
      // Re-fetch the server-rendered page so saved data is visible without F5.
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);
}
