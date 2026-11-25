"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import type { ActionState } from "@/lib/actions/types";

export function useActionToast(state: ActionState) {
  useEffect(() => {
    if (!state.message) return;

    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state.message, state.ok]);
}
