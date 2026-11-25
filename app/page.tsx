import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  MapPin,
  Presentation,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { BrandMark } from "@/components/brand-mark";
import { GoogleStripe } from "@/components/google-stripe";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const schedule = [
  ["26/11", "Kick-off & Q&A"],
  ["26–30/11", "Đăng ký, ghép đội"],
  ["26/11–03/12", "Nộp proposal"],
  ["07/12", "Mentor feedback"],
  ["07–13/12", "Online Hackathon"],
  ["15/12", "Demo Day tại HUST"],
];

const challenges = [
  {
    name: "FinTech",
    accent: "border-t-brand-red",
    items: ["AI cho ngân hàng", "Quản lý tài chính cá nhân", "Chia tiền bằng VietQR"],
  },
  {
    name: "HealthTech",
    accent: "border-t-brand-green",
    items: ["AI hỗ trợ y tế", "Hướng dẫn sơ cứu", "Nhắc uống thuốc"],
  },
  {
    name: "EdTech",
    accent: "border-t-brand-blue",
    items: ["Ôn thi theo lỗ hổng", "Sổ liên lạc điện tử", "Kế hoạch học tập"],
  },
  {
    name: "BizTech",
    accent: "border-t-brand-yellow",
    items: ["Bán hàng cho quán nhỏ", "Tối ưu vận hành", "Booking KOL/KOC"],
  },
  {
    name: "Open Innovation",
    accent: "border-t-brand-blue",
    items: ["AI cho truyền thông", "AI cho Hội sinh viên", "AI cho cơ quan nhà nước"],
  },
  {
    name: "Game Challenge",
    accent: "border-t-brand-red",
    items: ["Escape room trong trường", "Đấu trường kiến thức"],
  },
];

const stages = [
  {
    icon: FileText,
    date: "26/11–03/12",
    title: "Đăng ký & proposal",
    body: "Đội 3–5 người, tối đa 3 Dev và 1–2 Marcom hoặc Operation. Proposal gồm thông tin đội, tổng quan, vấn đề & người dùng, giải pháp, công nghệ & kiến trúc, hướng phát triển.",
  },
  {
    icon: Presentation,
    date: "07–13/12",
    title: "Online Hackathon",
    body: "Mentor feedback ngày 07/12. Hoàn thiện luồng chính, tích hợp thành phần và quay video demo.",
  },
  {
    icon: MapPin,
    date: "15/12",
    title: "Demo Day",
    body: "Offline tại HUST. Mỗi đội 7 phút demo + 3 phút Q&A; hai đội điểm cao phản biện chéo.",
  },
];

const scoring = [
  ["Vòng 1 · Proposal", "Ý tưởng 70% · Công nghệ 30%"],
  ["Vòng 2 · Demo Day", "Ý tưởng 40% · Sản phẩm 40% · Trình bày 20%"],
];

const benefits = [
  ["Mentor", "Feedback proposal và hỗ trợ trong tuần build."],
  ["Làm việc với các ban", "Marcom, Operation và Dev cùng làm một sản phẩm."],
  ["Sản phẩm cho CV", "Một dự án hoàn chỉnh để đưa vào CV."],
];

const toneClasses = [
  "bg-primary-container text-on-primary-container",
  "bg-success-container text-on-success-container",
  "bg-warning-container text-on-warning-container",
  "bg-error-container text-on-error-container",
];

const faqs = [
  ["Ai có thể tham gia?", "Thành viên GDG-HUST. Đội 3–5 người, tối đa 3 Dev và 1–2 Marcom hoặc Operation."],
  ["Đăng ký khi nào?", "26/11–30/11. BTC hỗ trợ ghép đội."],
  ["Khi nào nộp proposal?", "26/11–03/12. Proposal chiếm 70% điểm ở vòng 1."],
  ["Khi nào có mentor?", "07/12, trước Online Hackathon 07–13/12."],
];

export default async function HomePage() {
  const session = await auth();
  const signedIn = Boolean(session?.user?.profileId);
  const href = signedIn ? "/overview" : "/login";
  const label = signedIn ? "Vào tổng quan" : "Đăng nhập với Google";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant bg-surface">
        <GoogleStripe />
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="#challenges"
              className="rounded-full px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            >
              Challenge
            </Link>
            <Link
              href="#schedule"
              className="rounded-full px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            >
              Lịch
            </Link>
            <Link
              href="#faq"
              className="rounded-full px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            >
              FAQ
            </Link>
          </div>
          <Link href={href} className={buttonClass({ size: "sm" })}>
            {label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-outline-variant">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_70%_0%,#d3e3fd_0%,rgba(211,227,253,0)_70%)]"
          />
          <div className="relative mx-auto grid w-full max-w-[1400px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16 lg:px-8 lg:py-20">
            <div>
              <Badge tone="primary">26/11 – 15/12 · Hà Nội</Badge>
              <h1 className="mt-5 max-w-2xl text-4xl font-medium leading-[1.12] tracking-tight text-on-surface sm:text-5xl">
                Internal Hackathon 2026
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
                Đội 3–5 người. Nộp proposal trước 03/12. Demo tại HUST ngày
                15/12.
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Tối đa 3 Dev, 1–2 Marcom hoặc Operation. Dành cho thành viên
                GDG-HUST.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={href} className={buttonClass({ size: "lg" })}>
                  {label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="#challenges"
                  className={buttonClass({ variant: "outline", size: "lg" })}
                >
                  Xem challenge
                </Link>
              </div>
            </div>

            <Card id="schedule" className="p-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-on-surface-variant" aria-hidden />
                <h2 className="text-base font-medium text-on-surface">Lịch</h2>
              </div>
              <dl className="mt-4 divide-y divide-outline-variant">
                {schedule.map(([date, text]) => (
                  <div key={date} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                    <dt className="w-24 shrink-0 font-mono text-xs text-on-surface-variant">
                      {date}
                    </dt>
                    <dd className="text-sm leading-6 text-on-surface">{text}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-outline-variant pt-4 text-xs leading-5 text-on-surface-variant">
                Demo Day offline tại Trường Đại học Bách khoa Hà Nội.
              </p>
            </Card>
          </div>
        </section>

        <section id="challenges" className="border-b border-outline-variant bg-surface">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-medium tracking-tight text-on-surface">
              6 nhóm challenge
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <Card
                  key={challenge.name}
                  className={`border-t-4 p-4 ${challenge.accent}`}
                >
                  <h3 className="text-sm font-medium text-on-surface">
                    {challenge.name}
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {challenge.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm leading-6 text-on-surface-variant"
                      >
                        <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-medium tracking-tight text-on-surface">
            Ba vòng
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <Card key={stage.title} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${toneClasses[index % toneClasses.length]}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">
                      {stage.date}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-on-surface">
                    {stage.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    {stage.body}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {scoring.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container px-4 py-3"
              >
                <span className="text-sm font-medium text-on-surface">{label}</span>
                <span className="text-xs text-on-surface-variant">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-outline-variant bg-surface">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-medium tracking-tight text-on-surface">
              Quyền lợi
            </h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {benefits.map(([title, body], index) => (
                <div key={title} className="rounded-2xl border border-outline-variant p-5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClasses[index % toneClasses.length]}`}
                    >
                      <Users className="h-4 w-4" aria-hidden />
                    </span>
                    <h3 className="text-sm font-medium text-on-surface">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-on-surface">
              Câu hỏi thường gặp
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Thông tin từ BTC. Thắc mắc khác hỏi ở Kick-off 26/11.
            </p>
          </div>
          <div className="divide-y divide-outline-variant rounded-2xl border border-outline-variant bg-surface">
            {faqs.map(([q, a]) => (
              <details key={q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-on-surface">
                  {q}
                  <span className="text-lg leading-none text-on-surface-variant transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-8 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandMark compact />
          <span>GDG-HUST Internal Hackathon 2026 · Demo Day 15/12 tại HUST.</span>
        </div>
      </footer>
    </div>
  );
}
