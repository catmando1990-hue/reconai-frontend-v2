"use client";

import { useEffect, useRef } from "react";
import { getVideoUrl } from "@/config/video-urls";

export function AIVideoPreview() {
  const ref = useRef<HTMLVideoElement>(null);
  const previewVideoUrl = getVideoUrl("reconaiPreview", "/videos/reconai-preview.mp4");

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <video
        ref={ref}
        src={previewVideoUrl}
        muted
        loop
        playsInline
        preload="auto"
        className="w-full h-auto"
        onClick={(e) => {
          const v = e.currentTarget;
          v.muted = false;
          v.controls = true;
          v.play();
        }}
      />
      <div className="px-3 py-2 text-xs text-muted-foreground">
        AI-powered financial intelligence — explained.
      </div>
    </div>
  );
}
