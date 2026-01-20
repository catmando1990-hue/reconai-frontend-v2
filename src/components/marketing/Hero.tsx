"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getVideoUrl } from "@/config/video-urls";
import LazyVideo from "@/components/media/LazyVideo";

export default function Hero() {
  const heroVideoUrl = getVideoUrl("heroLoop", "/videos/hero-loop.mp4");
  const heroPosterUrl = getVideoUrl("heroPoster", "/videos/hero-poster.webp");
  const reduceMotion = useReducedMotion();

  // Ensures server + first client render match (prevents hydration mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Background media */}
      <div className="absolute inset-0 -z-10">
        {/* VIDEO (lowest layer) - sources attach only when in-view */}
        <LazyVideo
          src={heroVideoUrl}
          poster={heroPosterUrl}
          preload="none"
          autoPlayOnVisible={!reduceMotion}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          ariaHidden
        />

        {/* Soft gradient mask for text contrast (works in light + dark) */}
        <div className="absolute inset-0 z-10 bg-linear-to-b from-black/55 via-black/25 to-black/60 dark:from-black/65 dark:via-black/30 dark:to-black/75" />

        {/* Top "spotlight" mask (adds premium depth) */}
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
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl"
        >
          ReconAI organizes financial data for review.
        </motion.h1>

        <motion.p
          initial={mounted && !reduceMotion ? { opacity: 0, y: 16 } : false}
          animate={mounted && !reduceMotion ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
          className="mt-6 max-w-2xl text-pretty text-lg text-white/85"
        >
          Categorizes transactions, detects patterns, and generates structured
          reports. Works for individuals, small businesses, and enterprise
          teams.
        </motion.p>

        <motion.div
          initial={mounted && !reduceMotion ? { opacity: 0, y: 16 } : false}
          animate={mounted && !reduceMotion ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.16, ease: "easeOut" }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            href="/platform"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:opacity-90"
          >
            See the product <ArrowRight className="ml-2 h-4 w-4" />
          </a>

          <a
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            Explore features
          </a>
        </motion.div>
      </div>
    </section>
  );
}
