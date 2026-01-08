"use client";

import { useEffect, useRef } from "react";

export function ComplianceShieldLoop() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-border bg-card">
      <video
        ref={ref}
        src="/videos/compliance-shield-loop.mp4"
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-auto object-cover"
        aria-hidden="true"
      />
    </div>
  );
}
