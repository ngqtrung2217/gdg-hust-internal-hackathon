import Link from "next/link";
import { AlertCircle, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/auth";
import { joinWithLinkAction } from "@/lib/actions/team";
import { hashInviteToken } from "@/lib/invite-token";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { formatDateTime } from "@/lib/utils/date";
import { BrandMark } from "@/components/brand-mark";
import { FlashToast } from "@/components/flash-toast";
import { GoogleStripe } from "@/components/google-stripe";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { signInAndJoinAction } from "./actions";

export const dynamic = "force-dynamic";

type InvitePreview = {
  team_name: string;
  team_description: string | null;
  member_count: number;
  max_members: number;
  expires_at: string;
  joinable: boolean;
};

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const session = await auth();
  const signedIn = Boolean(session?.user?.profileId);
  const validToken = /^[0-9a-f]{64}$/i.test(token);

  let invite: InvitePreview | null = null;
  let previewFailed = false;

  if (validToken) {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc("get_invite_link_preview", {
      p_token_hash: hashInviteToken(token),
    });

    previewFailed = Boolean(error);
    invite = (data as InvitePreview[] | null)?.[0] ?? null;
  }

  const linkMissing = validToken && !previewFailed && !invite;
  const canJoin = validToken && !linkMissing && (invite?.joinable ?? true);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <FlashToast error={query.error ? "Link không hợp lệ, đã hết hạn hoặc đội đã đủ người." : undefined} />

      <header className="border-b border-outline-variant bg-surface">
        <GoogleStripe />
        <div className="flex h-16 w-full items-center px-4 sm:px-6 lg:px-8">
          <BrandMark />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <Card className="border-t-4 border-t-primary p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Users className="h-5 w-5" aria-hidden />
          </div>

          <p className="mt-5 text-sm font-medium text-primary">
            Lời mời vào đội
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-on-surface">
            {invite ? invite.team_name : "Tham gia đội"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {invite && invite.joinable
              ? signedIn
                ? "Bấm tham gia để vào đội. Mỗi người chỉ thuộc một đội."
                : "Đăng nhập bằng email BTC đã duyệt để tham gia đội này."
              : invite
                ? "Hiện chưa thể tham gia đội này."
                : previewFailed
                  ? "Không tải được thông tin đội, nhưng bạn vẫn có thể thử tham gia."
                  : "Đăng nhập bằng đúng email đã được BTC duyệt để nhận lời mời."}
          </p>

          {invite ? (
            <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={invite.joinable ? "success" : "warning"}>
                  {invite.joinable ? "Đang nhận thành viên" : "Không nhận thêm"}
                </Badge>
                <Badge tone="neutral">
                  <Users className="h-3 w-3" aria-hidden />
                  {invite.member_count}/{invite.max_members} thành viên
                </Badge>
              </div>

              {invite.team_description ? (
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-on-surface-variant">
                  {invite.team_description}
                </p>
              ) : null}

              <p className="mt-3 text-xs leading-5 text-on-surface-variant">
                Link hết hạn {formatDateTime(invite.expires_at)}.
              </p>
            </div>
          ) : null}

          {!validToken || linkMissing ? (
            <Alert className="mt-5">
              <AlertCircle className="h-4 w-4" aria-hidden />
              <AlertDescription>
                Link không hợp lệ, đã hết hạn, hoặc đội đã đủ người. Liên hệ đội
                trưởng để lấy link mới.
              </AlertDescription>
            </Alert>
          ) : query.error ? (
            <Alert className="mt-5">
              <AlertCircle className="h-4 w-4" aria-hidden />
              <AlertDescription>
                Không tham gia được. Đội có thể vừa đủ người hoặc link đã hết
                hiệu lực.
              </AlertDescription>
            </Alert>
          ) : invite && !invite.joinable ? (
            <div className="mt-5 flex gap-2 rounded-lg bg-warning-container p-3 text-sm leading-6 text-on-warning-container">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Đội hiện chưa thể nhận thêm thành viên. Liên hệ đội trưởng nếu bạn
              cho rằng đây là nhầm lẫn.
            </div>
          ) : previewFailed ? (
            <div className="mt-5 flex gap-2 rounded-lg bg-warning-container p-3 text-sm leading-6 text-on-warning-container">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Chưa tải được thông tin đội. Bạn vẫn có thể thử tham gia.
            </div>
          ) : null}

          {canJoin ? (
            signedIn ? (
              <form action={joinWithLinkAction} className="mt-6">
                <input type="hidden" name="token" value={token} />
                <SubmitButton className="w-full" pendingText="Đang tham gia…">
                  Tham gia đội
                </SubmitButton>
              </form>
            ) : (
              <form action={signInAndJoinAction} className="mt-6">
                <input type="hidden" name="token" value={token} />
                <GoogleSignInButton />
              </form>
            )
          ) : (
            <Link
              href={signedIn ? "/teams" : "/"}
              className={buttonClass({
                variant: "outline",
                className: "mt-6 w-full",
              })}
            >
              {signedIn ? "Tìm đội khác" : "Về trang chủ"}
            </Link>
          )}

          <div className="mt-6 flex items-start gap-2 rounded-lg bg-surface-container p-3 text-xs leading-5 text-on-surface-variant">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Link mời có thể hết hạn hoặc dừng khi đội đã đủ người.
          </div>
        </Card>
      </main>
    </div>
  );
}
