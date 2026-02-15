import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "홀덤 트레이너",
    short_name: "홀덤",
    description: "듀오링고 스타일 홀덤 프리플랍 학습",
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
