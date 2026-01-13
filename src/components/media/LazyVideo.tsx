"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * LazyVideo
 * - Prevents video downloads on first paint by not attaching sources until in-view.
 * - Uses IntersectionObserver to load + optionally autoplay when visible.
 * - Honors prefers-reduced-motion by disabling autoplay (still loads if user interacts).
 */
export default function LazyVideo({
  src,
  poster,
  className,
  threshold = 0.25,
  rootMargin = "200px 0px",
  autoPlayOnVisible = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = "none",
  ariaHidden,
  onClick,
}: {
  src: string;
  poster?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  autoPlayOnVisible?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
  ariaHidden?: boolean;
  onClick?: React.MouseEventHandler<HTMLVideoElement>;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLVideoElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  const canAutoplay = useMemo(() => {
    return autoPlayOnVisible && !reduceMotion;
  }, [autoPlayOnVisible, reduceMotion]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    // Ensure autoplay-friendly defaults (some browsers are picky)
    v.muted = muted;
    v.defaultMuted = muted;
    v.playsInline = playsInline;
    v.loop = loop;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(v);
    return () => observer.disconnect();
  }, [threshold, rootMargin, muted, playsInline, loop]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!shouldLoad) return;

    if (!canAutoplay) return;

    let cancelled = false;

    const playWhenReady = async () => {
      if (cancelled) return;
      try {
        // Wait until enough data is available to play
        if (v.readyState < 3) {
          await new Promise<void>((resolve) => {
            const onCanPlay = () => resolve();
            v.addEventListener("canplay", onCanPlay, { once: true });
          });
        }
        await v.play();
      } catch {
        // Autoplay may be blocked; ignore silently
      }
    };

    playWhenReady();

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, canAutoplay]);

  return (
    <video
      ref={ref}
      poster={poster}
      preload={preload}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      className={className}
      aria-hidden={ariaHidden ? "true" : undefined}
      onClick={onClick}
    >
      {shouldLoad ? <source src={src} type="video/mp4" /> : null}
    </video>
  );
}
