"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function ReconUtilityHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [dropdownOpen]);

  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

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

        <div
          ref={dropdownRef}
          className="recon-dropdown"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button
            type="button"
            className="recon-link recon-dropdown-trigger"
            onClick={toggleDropdown}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            Resources
            <ChevronDown
              className={`recon-dropdown-chevron ${dropdownOpen ? "open" : ""}`}
            />
          </button>
          <div
            className={`recon-dropdown-content ${dropdownOpen ? "open" : ""}`}
            role="menu"
          >
            <Link href="/how-it-works" role="menuitem" onClick={closeDropdown}>
              How it works
            </Link>
            <Link href="/packages" role="menuitem" onClick={closeDropdown}>
              Packages
            </Link>
            <Link href="/support" role="menuitem" onClick={closeDropdown}>
              Help
            </Link>
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
