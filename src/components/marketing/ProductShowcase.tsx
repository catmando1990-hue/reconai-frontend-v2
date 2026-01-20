"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * ProductShowcase - Dashboard preview section
 *
 * Uses token-only styling for light/dark parity.
 * UI screenshot wrapped in surface frame with subtle dark-mode dimming.
 */
export default function ProductShowcase() {
  return (
    <section id="demo" className="bg-muted/50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              A product people can feel
            </h2>
            <p className="mt-3 text-muted-foreground">
              Use real screenshots, subtle motion, and short demo loops to show
              value instantly.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>• Clear financial summaries and trends</li>
              <li>• Feature callouts that match the UI</li>
              <li>• Fast navigation and enterprise-ready structure</li>
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="relative aspect-16/10">
              <Image
                src="/images/dashboard.webp"
                alt="ReconAI dashboard preview"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover dark:opacity-90"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
