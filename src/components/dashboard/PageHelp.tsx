'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Lightbulb, CheckCircle2 } from 'lucide-react';

interface PageHelpProps {
  title: string;
  description: string;
  features?: string[];
  tips?: string[];
}

export default function PageHelp({ title, description, features = [], tips = [] }: PageHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:text-primary rounded-full p-1 transition-colors"
        aria-label={`Help for ${title}`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="border-border max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border bg-card/90 shadow-2xl backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <HelpCircle className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-primary font-mono text-xs tracking-[0.2em] uppercase">Help</p>
                    <h2 className="text-foreground text-lg font-medium">{title}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-card/10"
                >
                  <X className="text-muted-foreground h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[calc(85vh-140px)] overflow-y-auto p-6">
                <p className="text-foreground mb-6 leading-relaxed">{description}</p>

                {features.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="text-reconai-success h-4 w-4" />
                      Features
                    </h3>
                    <ul className="space-y-2">
                      {features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-muted-foreground flex items-start gap-2 text-sm"
                        >
                          <span className="bg-primary mt-2 h-1 w-1 shrink-0 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tips.length > 0 && (
                  <div>
                    <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-medium">
                      <Lightbulb className="text-primary h-4 w-4" />
                      Tips
                    </h3>
                    <ul className="space-y-2">
                      {tips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="bg-primary/5 text-foreground flex items-start gap-2 rounded-lg p-3 text-sm"
                        >
                          <Lightbulb className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
