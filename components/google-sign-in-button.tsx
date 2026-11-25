"use client";

import { useFormStatus } from "react-dom";

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9086c1.7018-1.5668 2.6837-3.874 2.6837-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1809l-2.9086-2.2581c-.8059.54-1.8368.8591-3.0478.8591-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.7098c-.18-.54-.2823-1.1168-.2823-1.7098s.1023-1.1698.2823-1.7098V4.9591H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0409l3.0067-2.3311z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9591l3.0067 2.3311C4.6718 5.1627 6.656 3.5795 9 3.5795z"
      />
    </svg>
  );
}

export function GoogleSignInButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center gap-3 rounded-[4px] border border-[#747775] bg-white px-3 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
    >
      <GoogleG />
      {pending ? "Đang chuyển hướng…" : "Đăng nhập với Google"}
    </button>
  );
}
