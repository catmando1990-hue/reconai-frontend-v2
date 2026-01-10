"use client";

import "@/styles/recon-hero-awardwinning.css";

export function HeroBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="recon-hero-v3 recon-animate">
      <div className="vignette" />
      <div className="beam" />
      <div className="grid" />
      <div className="noise" />
      <div className="scanline" />
      <div className="content">{children}</div>
    </div>
  );
}
