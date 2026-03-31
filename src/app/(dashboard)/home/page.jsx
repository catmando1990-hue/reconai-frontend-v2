"use client";

import AIChat from "@/components/AIChat";
import "@/styles/DashboardHome.css";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Clock,
  Cloud,
  CloudRain,
  Database,
  FileText,
  Newspaper,
  Receipt,
  RefreshCw,
  Sparkles,
  Sun,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const modules = [
  {
    name: "CORE",
    description: "Financial operations & accounting",
    icon: Database,
    color: "teal",
    path: "/core",
  },
  {
    name: "CFO Suite",
    description: "Executive insights & reporting",
    icon: Briefcase,
    color: "blue",
    path: "/cfo",
  },
  {
    name: "Payroll",
    description: "Workforce & compensation management",
    icon: Wallet,
    color: "green",
    path: "/payroll",
  },
  {
    name: "GovCon",
    description: "Government contracting & DCAA compliance",
    icon: Building2,
    color: "purple",
    path: "/govcon",
  },
  {
    name: "Invoicing",
    description: "Invoice creation & customer billing",
    icon: Receipt,
    color: "orange",
    path: "/invoicing",
  },
  {
    name: "Documents",
    description: "Document management & storage",
    icon: FileText,
    color: "slate",
    path: "/documents",
  },
];

const intelligenceLinks = [
  { name: "Core", icon: Database, path: "/core/intelligence" },
  { name: "CFO", icon: Briefcase, path: "/cfo/intelligence" },
  { name: "Payroll", icon: Wallet, path: "/payroll/intelligence" },
  { name: "GovCon", icon: Building2, path: "/govcon/intelligence" },
];

const newsItems = [
  {
    id: 1,
    title: "Federal Reserve Holds Interest Rates Steady",
    source: "Reuters",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "Q1 GDP Growth Exceeds Expectations at 3.2%",
    source: "Bloomberg",
    time: "4 hours ago",
  },
  {
    id: 3,
    title: "Small Business Lending Shows Signs of Recovery",
    source: "WSJ",
    time: "6 hours ago",
  },
  {
    id: 4,
    title: "New Tax Regulations for Government Contractors",
    source: "GovExec",
    time: "8 hours ago",
  },
];

export default function DashboardHome() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="dashboard-home">
      <div className="home-layout">
        <div className="home-main">
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-content">
              <h1>{getGreeting()}, John</h1>
              <p>Welcome to ReconAI. Here&apos;s your workspace for today.</p>
            </div>
            <div className="refresh-control">
              <span className="last-refresh">
                <Clock size={14} />
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                className={`refresh-btn ${isRefreshing ? "spinning" : ""}`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="home-grid">
            {/* Quick Navigation - Major Modules */}
            <div className="card modules-card">
              <div className="card-header">
                <h3>Quick Access</h3>
                <span className="card-subtitle">Navigate to major modules</span>
              </div>
              <div className="modules-grid">
                {modules.map((module) => (
                  <Link
                    key={module.name}
                    href={module.path}
                    className={`module-item ${module.color}`}
                  >
                    <div className="module-icon">
                      <module.icon size={24} />
                    </div>
                    <div className="module-info">
                      <h4>{module.name}</h4>
                      <p>{module.description}</p>
                    </div>
                    <ArrowRight size={18} className="module-arrow" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Intelligence Quick Links */}
            <div className="card intelligence-links-card">
              <div className="card-header">
                <h3>
                  <Sparkles size={18} />
                  Intelligence
                </h3>
              </div>
              <div className="intelligence-links-grid">
                {intelligenceLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    className="intelligence-link-btn"
                  >
                    <link.icon size={16} />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Context Row: Weather + News */}
            <div className="context-row">
              {/* Weather Widget */}
              <div className="card weather-card">
                <div className="weather-main">
                  <Sun size={48} className="weather-icon" />
                  <div className="weather-temp">
                    <span className="temp-value">72</span>
                    <span className="temp-unit">°F</span>
                  </div>
                </div>
                <div className="weather-details">
                  <p className="weather-location">San Francisco, CA</p>
                  <p className="weather-desc">Partly Cloudy</p>
                </div>
                <div className="weather-forecast">
                  <div className="forecast-item">
                    <span>Tue</span>
                    <Sun size={16} />
                    <span>75°</span>
                  </div>
                  <div className="forecast-item">
                    <span>Wed</span>
                    <Cloud size={16} />
                    <span>68°</span>
                  </div>
                  <div className="forecast-item">
                    <span>Thu</span>
                    <CloudRain size={16} />
                    <span>62°</span>
                  </div>
                </div>
              </div>

              {/* Business News */}
              <div className="card news-card">
                <div className="card-header">
                  <h3>
                    <Newspaper size={18} />
                    Business News
                  </h3>
                </div>
                <div className="news-list">
                  {newsItems.map((item) => (
                    <a key={item.id} href="#" className="news-item">
                      <h4>{item.title}</h4>
                      <div className="news-meta">
                        <span className="news-source">{item.source}</span>
                        <span className="news-time">{item.time}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Chat Sidebar */}
        <div className="home-chat">
          <AIChat />
        </div>
      </div>
    </div>
  );
}
