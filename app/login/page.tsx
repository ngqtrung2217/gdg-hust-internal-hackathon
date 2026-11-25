import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { signInWithGoogle } from "./actions";
import { BrandMark } from "@/components/brand-mark";
import { FlashToast } from "@/components/flash-toast";
import { GoogleStripe } from "@/components/google-stripe";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function errorMessage(code: string | undefined) {
  if (code === "pending") {
    return "Yêu cầu truy cập đã được gửi. BTC sẽ duyệt, sau đó bạn đăng nhập lại.";
  }
  if (code === "AccessDenied" || code === "not_allowed") {
    return "Email chưa có trong danh sách BTC, hoặc quyền truy cập đã bị thu hồi.";
  }
  if (code === "Configuration") {
    return "Cấu hình đăng nhập chưa đúng. Liên hệ BTC.";
  }
  if (code === "profile") {
    return "Hồ sơ chưa được khởi tạo. Đăng xuất rồi đăng nhập lại.";
  }
  if (code) {
    return "Đăng nhập chưa hoàn tất. Thử lại.";
  }
  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await auth();
  if (session?.user?.profileId) {
    redirect("/overview");
  }

  const params = await searchParams;
  const code = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = errorMessage(code);

  return (
    <div className="min-h-screen bg-background">
      <FlashToast error={message ?? undefined} />

      <header className="border-b border-outline-variant bg-surface">
        <GoogleStripe />
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Trang chủ
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <Card className="border-t-4 border-t-primary p-6 sm:p-8">
          <h1 className="text-2xl font-medium tracking-tight text-on-surface">
            Đăng nhập
          </h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Internal Hackathon 2026 · 26/11–15/12. Dùng email BTC đã duyệt.
          </p>

          {message ? (
            <div
              role="alert"
              className="mt-5 flex gap-2 rounded-xl bg-error-container p-3 text-sm leading-6 text-on-error-container"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {message}
            </div>
          ) : null}

          <form action={signInWithGoogle} className="mt-6">
            <GoogleSignInButton />
          </form>

          <p className="mt-4 text-xs leading-5 text-on-surface-variant">
            Không có đăng ký công khai.
          </p>
        </Card>
      </main>
    </div>
  );
}
