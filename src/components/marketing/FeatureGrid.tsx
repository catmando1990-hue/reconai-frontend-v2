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
      <h2 className="text-3xl font-semibold tracking-tight">Built for real-world operations</h2>
      <p className="mt-3 max-w-2xl text-zinc-600">
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
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
