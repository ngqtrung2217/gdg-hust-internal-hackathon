import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { GoogleStripe } from "@/components/google-stripe";
import { signOutAction } from "@/lib/actions/auth";
import { AdminNav } from "./admin-nav";

export function AdminShell({
  email,
  pendingRequestCount,
  children,
}: {
  email: string;
  pendingRequestCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-white/10 bg-[#131314] text-white">
        <GoogleStripe />
        <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2.5"
            aria-label="BTC Console — GDG on Campus HUST"
          >
            <Image
              src="/gdg-logo.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="leading-tight">
              <span className="block text-[13px] font-medium tracking-tight">
                GDG on Campus · HUST
              </span>
              <span className="block text-[11px] text-white/60">
                Internal Hackathon 2026
              </span>
            </span>
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            BTC
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-white/60 sm:inline">
              {email}
            </span>
            <Link
              href="/overview"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Trang thí sinh</span>
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AdminNav pendingRequestCount={pendingRequestCount} />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>

      <footer className="border-t border-outline-variant">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-xs text-on-surface-variant sm:px-6 lg:px-8">
          BTC Console · GDG-HUST Internal Hackathon 2026
        </div>
      </footer>
    </div>
  );
}
