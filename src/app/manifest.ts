import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "홀덤 트레이너 — 프리플랍 연습",
    short_name: "홀덤 트레이너",
    description: "홀덤 초보를 위한 무료 프리플랍 연습 웹앱. 스킬트리로 단계별 학습.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a2e",
    theme_color: "#1a1a2e",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
