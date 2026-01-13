"use client";

import { getVideoUrl } from "@/config/video-urls";
import LazyVideo from "@/components/media/LazyVideo";

export function AIVideoPreview() {
  const previewVideoUrl = getVideoUrl(
    "reconaiPreview",
    "/videos/reconai-preview.mp4",
  );
  const posterUrl = "/videos/reconai-preview-poster.webp";

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <LazyVideo
        src={previewVideoUrl}
        poster={posterUrl}
        preload="none"
        className="w-full h-auto"
        onClick={(e) => {
          const v = e.currentTarget;
          v.muted = false;
          v.controls = true;
          v.play().catch(() => {});
        }}
      />
      <div className="px-3 py-2 text-xs text-muted-foreground">
        AI-powered financial intelligence — explained.
      </div>
    </div>
  );
}
