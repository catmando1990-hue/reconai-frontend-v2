"use client";

import "@/styles/recon-header.css";
import { Bell, ChevronDown, Mail, Maximize2, Search } from "lucide-react";

export default function Header() {
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

        <div className="user-profile">
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="John Doe"
            className="user-avatar"
          />
          <span className="user-name">John Doe</span>
          <ChevronDown size={16} className="user-dropdown-icon" />
        </div>
      </div>
    </header>
  );
}
