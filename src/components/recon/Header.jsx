"use client";

import "@/styles/recon-header.css";
import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, ChevronDown, LogIn, Mail, Maximize2, Search } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const { user: clerkUser } = useUser();

  const fullName =
    [user?.given_name || user?.first_name || clerkUser?.firstName,
     user?.family_name || user?.last_name || clerkUser?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.email ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    "User";

  return (
    <header className="recon-header">
      <div className="header-left">
        <button className="header-btn">
          <Search size={18} />
        </button>
        <button className="header-btn">
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="header-search">
        <Search size={16} className="search-icon" />
        <input type="text" placeholder="Search or enter website name" />
      </div>

      <div className="header-right">
        <button className="header-btn notification">
          <Bell size={20} />
          <span className="badge red">5</span>
        </button>
        <button className="header-btn notification">
          <Mail size={20} />
          <span className="badge blue">3</span>
        </button>

        {isAuthenticated ? (
          <div className="user-profile" title={fullName}>
            <UserButton afterSignOutUrl="/sign-in" />
            <span className="user-name">{fullName}</span>
            <ChevronDown size={16} className="user-dropdown-icon" />
          </div>
        ) : (
          <Link href="/sign-in" className="user-profile signin-link">
            <LogIn size={18} />
            <span className="user-name">Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
