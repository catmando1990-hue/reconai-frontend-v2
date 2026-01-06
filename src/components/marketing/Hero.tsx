'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background video */}
      <div className="absolute inset-0 -z-10">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/video/hero-poster.webp"
          className="h-full w-full object-cover"
        >
          <source src="/video/hero-loop.mp4" type="video/mp4" />
        </video>

        {/* Contrast overlay (theme-safe) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60 dark:from-black/65 dark:via-black/40 dark:to-black/70" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl"
        >
          ReconAI turns financial noise into clarity.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
          className="mt-6 max-w-2xl text-pretty text-lg text-white/80"
        >
          Built for individuals, small businesses, and enterprise teams—ReconAI analyzes
          transactions, operational activity, and financial patterns to support better decisions
          with explainable insight.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: 'easeOut' }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            href="#demo"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:opacity-90"
          >
            See the product
            <ArrowRight className="ml-2 h-4 w-4" />
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
