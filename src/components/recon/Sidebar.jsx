"use client";

import "@/styles/recon-sidebar.css";
import {
  Box,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  {
    title: "Navigation",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        submenu: [
          { name: "Home", path: "/home" },
          { name: "CORE", path: "/core" },
          { name: "CFO", path: "/cfo", badge: "NEW" },
          { name: "Payroll", path: "/payroll", badge: "NEW" },
          { name: "GovCon", path: "/govcon", badge: "NEW" },
          { name: "Invoicing", path: "/invoicing", badge: "NEW" },
        ],
      },
      { name: "Navigation", icon: Navigation },
      { name: "Widget", icon: Box, badge: "100+" },
    ],
  },
];

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState(["Dashboard"]);
  const pathname = usePathname();

  const toggleExpand = (name) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name],
    );
  };

  const isSubmenuActive = (submenu) => {
    return submenu?.some((item) => {
      if (item.path === "/home")
        return pathname === "/home" || pathname === "/";
      return pathname.startsWith(item.path);
    });
  };

  const isLinkActive = (path) => {
    if (path === "/home") return pathname === "/home" || pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <span>a</span>
          </div>
          <span className="logo-text">adminty</span>
        </div>
        <button className="sidebar-toggle">
          <span></span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((section) => (
          <div key={section.title} className="nav-section">
            <h3 className="nav-section-title">{section.title}</h3>
            <ul className="nav-list">
              {section.items.map((item) => (
                <li key={item.name} className="nav-item">
                  <a
                    href="#"
                    className={`nav-link ${item.submenu ? "has-submenu" : ""} ${
                      expandedItems.includes(item.name) ? "expanded" : ""
                    } ${isSubmenuActive(item.submenu) ? "parent-active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.submenu) {
                        toggleExpand(item.name);
                      }
                    }}
                  >
                    <item.icon size={18} className="nav-icon" />
                    <span className="nav-text">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`nav-badge ${item.badgeColor || "teal"}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.submenu && (
                      <span className="submenu-arrow">
                        {expandedItems.includes(item.name) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </span>
                    )}
                  </a>
                  {item.submenu && expandedItems.includes(item.name) && (
                    <ul className="submenu">
                      {item.submenu.map((subitem) => (
                        <li key={subitem.name}>
                          <Link
                            href={subitem.path}
                            className={`submenu-link ${isLinkActive(subitem.path) ? "active" : ""}`}
                          >
                            <span className="submenu-dot"></span>
                            {subitem.name}
                            {subitem.badge && (
                              <span className="nav-badge teal">
                                {subitem.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
