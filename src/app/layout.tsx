import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "홀덤 트레이너",
  description: "듀오링고 스타일 홀덤 프리플랍 학습",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "홀덤 트레이너",
  },
  other: {
    "mobile-web-app-capable": "yes",
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
