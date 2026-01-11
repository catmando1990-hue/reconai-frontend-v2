"use client";

export default function ReconUtilityHeader() {
  return (
    <header className="recon-header">
      <div className="recon-left">
        <span className="recon-logo">ReconAI</span>
      </div>

      <nav className="recon-right">
        <button className="recon-link">Platform</button>

        <div className="recon-dropdown">
          <button className="recon-link">Resources</button>
          <div className="recon-dropdown-content">
            <a>Docs</a>
            <a>Blog</a>
            <a>Help</a>
          </div>
        </div>

        <button className="recon-link">Company</button>
        <button className="recon-link recon-signin">Sign in</button>
      </nav>
    </header>
  );
}
