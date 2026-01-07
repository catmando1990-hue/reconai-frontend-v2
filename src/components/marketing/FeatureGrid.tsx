'use client';

import { motion } from 'framer-motion';
import { LineChart, Layers, Shield, Sparkles } from 'lucide-react';

const items = [
  {
    icon: LineChart,
    title: 'Explainable insights',
    desc: 'See why each classification and recommendation happened.',
  },
  {
    icon: Layers,
    title: 'Scales with you',
    desc: 'From solo users to enterprise governance and controls.',
  },
  {
    icon: Shield,
    title: 'Security-first',
    desc: 'Built with auditability and sensitive data in mind.',
  },
  {
    icon: Sparkles,
    title: 'Automation that feels human',
    desc: 'AI supports decisions without hiding the logic.',
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Built for real-world operations</h2>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Clean workflows, realistic visuals, and motion that supports clarity—not gimmicks.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="group rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:hover:shadow-zinc-900/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                <Icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
