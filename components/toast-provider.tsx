"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: "#ffffff",
          color: "#1f1f1f",
          border: "1px solid #dadce0",
          borderRadius: "12px",
          fontSize: "14px",
          padding: "10px 14px",
        },
        success: {
          iconTheme: { primary: "#188038", secondary: "#e6f4ea" },
        },
        error: {
          iconTheme: { primary: "#b3261e", secondary: "#f9dedc" },
        },
      }}
    />
  );
}
