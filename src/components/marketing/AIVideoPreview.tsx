"use client";

import { useEffect, useRef, useState } from "react";
import { getVideoUrl } from "@/config/video-urls";

export function AIVideoPreview() {
  const ref = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const previewVideoUrl = getVideoUrl(
    "reconaiPreview",
    "/videos/reconai-preview.mp4",
  );

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!loaded) {
            setLoaded(true);
          }
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [loaded]);

  return (
    <div className="mt-6 max-w-2xl rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        className="w-full h-auto"
        onClick={(e) => {
          const v = e.currentTarget;
          v.muted = false;
          v.controls = true;
          v.play();
        }}
      >
        {loaded && <source src={previewVideoUrl} type="video/mp4" />}
      </video>
      <div className="px-3 py-2 text-xs text-muted-foreground">
        AI-powered financial intelligence — explained.
      </div>
    </div>
  );
}
