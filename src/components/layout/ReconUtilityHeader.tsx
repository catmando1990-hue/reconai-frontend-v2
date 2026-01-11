"use client";

import Link from "next/link";

export default function ReconUtilityHeader() {
  return (
    <header className="recon-header">
      <div className="recon-left">
        <Link href="/" className="recon-logo">
          ReconAI
        </Link>
      </div>

      <nav className="recon-right">
        <Link href="/platform" className="recon-link">
          Platform
        </Link>

        <div className="recon-dropdown">
          <span className="recon-link">Resources</span>
          <div className="recon-dropdown-content">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/packages">Packages</Link>
            <Link href="/support">Help</Link>
          </div>
        </div>

        <Link href="/about" className="recon-link">
          Company
        </Link>
        <Link href="/dashboard" className="recon-link">
          Dashboard
        </Link>
        <Link href="/sign-in" className="recon-link recon-signin">
          Sign in
        </Link>
      </nav>
    </header>
  );
}
