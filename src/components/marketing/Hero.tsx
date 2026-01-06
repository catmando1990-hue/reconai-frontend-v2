'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Ensures server + first client render match (prevents hydration mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // After mount, enforce reduced-motion behavior without changing initial SSR markup
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Reinforce autoplay-friendly properties (some browsers are picky)
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.loop = true;

    if (reduceMotion) {
      v.pause();
      return;
    }

    let cancelled = false;

    const playNow = async () => {
      if (cancelled) return;

      try {
        // Wait until the video has enough data to play (prevents silent failures)
        if (v.readyState < 3) {
          await new Promise<void>((resolve) => {
            const onCanPlay = () => resolve();
            v.addEventListener('canplay', onCanPlay, { once: true });
          });
        }

        await v.play();
      } catch {
        // Autoplay can still be blocked; ignore silently
      }
    };

    playNow();

    return () => {
      cancelled = true;
    };
  }, [reduceMotion, mounted]);

  return (
    <section className="relative overflow-hidden">
      {/* Background media */}
      <div className="absolute inset-0 -z-10">
        {/* VIDEO (lowest layer) */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/video/hero-poster.webp"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        >
          <source src="/video/hero-loop.mp4" type="video/mp4" />
        </video>

        {/* Soft gradient mask for text contrast (works in light + dark) */}
        <div className="absolute inset-0 z-10 bg-linear-to-b from-black/55 via-black/25 to-black/60 dark:from-black/65 dark:via-black/30 dark:to-black/75" />

        {/* Top “spotlight” mask (adds premium depth) */}
        <div className="absolute inset-0 z-20 bg-[radial-gradient(900px_500px_at_30%_15%,rgba(255,255,255,0.10),transparent_60%)] dark:bg-[radial-gradient(900px_500px_at_30%_15%,rgba(255,255,255,0.06),transparent_60%)]" />

        {/* Subtle film grain (realism) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27600%27 height=%27600%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27600%27 height=%27600%27 filter=%27url(%23n)%27 opacity=%270.5%27/%3E%3C/svg%3E")',
          }}
        />
      </div>

      <div className="relative z-40 mx-auto max-w-6xl px-6 py-24 md:py-28">
        {/* Only animate after mount to avoid SSR/CSR style mismatch */}
        <motion.h1
          initial={mounted && !reduceMotion ? { opacity: 0, y: 16 } : false}
          animate={mounted && !reduceMotion ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl"
        >
          ReconAI turns financial noise into clarity.
        </motion.h1>

        <motion.p
          initial={mounted && !reduceMotion ? { opacity: 0, y: 16 } : false}
          animate={mounted && !reduceMotion ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
          className="mt-6 max-w-2xl text-pretty text-lg text-white/85"
        >
          Built for individuals, small businesses, and enterprise teams—ReconAI analyzes
          transactions, operational activity, and financial patterns to support better decisions
          with explainable insight.
        </motion.p>

        <motion.div
          initial={mounted && !reduceMotion ? { opacity: 0, y: 16 } : false}
          animate={mounted && !reduceMotion ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.16, ease: 'easeOut' }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            href="#demo"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:opacity-90"
          >
            See the product <ArrowRight className="ml-2 h-4 w-4" />
          </a>

          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            Explore features
          </a>
        </motion.div>
      </div>
    </section>
  );
}
