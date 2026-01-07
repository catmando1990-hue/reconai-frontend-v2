'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function ProductShowcase() {
  return (
    <section id="demo" className="bg-zinc-50 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">A product people can feel</h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Use real screenshots, subtle motion, and short demo loops to show value instantly.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <li>• Clear financial summaries and trends</li>
              <li>• Feature callouts that match the UI</li>
              <li>• Fast navigation and enterprise-ready structure</li>
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src="/images/dashboard.webp"
                alt="ReconAI dashboard preview"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
