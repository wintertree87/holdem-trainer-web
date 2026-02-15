import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

const siteUrl = "https://holdem-trainer-web-yy8p.vercel.app";

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
};

export const metadata: Metadata = {
  title: {
    default: "홀덤 트레이너 — 포지션별 프리플랍 연습",
    template: "%s | 홀덤 트레이너",
  },
  description:
    "홀덤 초보를 위한 무료 프리플랍 연습 웹앱. 듀오링고처럼 스킬트리를 따라가며 포지션별 RFI, 3bet 대응을 퀴즈로 연습하세요. 12유닛 41레슨 + 모의 게임 + 공략집.",
  keywords: [
    "홀덤 트레이너",
    "홀덤 연습",
    "홀덤 초보",
    "프리플랍 연습",
    "홀덤 프리플랍",
    "텍사스 홀덤 연습",
    "홀덤펍 연습",
    "포커 연습",
    "홀덤 레인지",
    "홀덤 포지션",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "홀덤 트레이너 — 포지션별 프리플랍 연습",
    description:
      "홀덤 초보를 위한 무료 프리플랍 연습 웹앱. 스킬트리로 단계별 학습, 봇 모의 게임, 오답 피드백까지.",
    url: siteUrl,
    siteName: "홀덤 트레이너",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "홀덤 트레이너 — 포지션별 프리플랍 연습",
    description:
      "홀덤 초보를 위한 무료 프리플랍 연습 웹앱. 스킬트리로 단계별 학습.",
  },
  alternates: {
    canonical: siteUrl,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "홀덤 트레이너",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "naver-site-verification": "9ae4710768f1fe6eecdf10c4585613d8515b6d42",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body
        className={`${geist.variable} font-sans antialiased min-h-screen`}
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
