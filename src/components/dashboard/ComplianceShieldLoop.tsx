"use client";

import { getVideoUrl } from "@/config/video-urls";
import LazyVideo from "@/components/media/LazyVideo";

export function ComplianceShieldLoop() {
  const videoUrl = getVideoUrl(
    "complianceShield",
    "/videos/compliance-shield-loop.mp4",
  );
  const posterUrl = "/videos/compliance-shield-poster.webp";

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-border bg-card">
      <LazyVideo
        src={videoUrl}
        poster={posterUrl}
        preload="none"
        className="w-full h-auto object-cover"
        ariaHidden
      />
    </div>
  );
}
