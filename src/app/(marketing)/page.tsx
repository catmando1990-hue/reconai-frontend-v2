import Hero from '@/components/marketing/Hero';
import FeatureGrid from '@/components/marketing/FeatureGrid';
import ProductShowcase from '@/components/marketing/ProductShowcase';

export default function MarketingHome() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <ProductShowcase />
      <footer className="border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-zinc-600">
          © {new Date().getFullYear()} ReconAI. All rights reserved.
        </div>
      </footer>
    </>
  );
}
