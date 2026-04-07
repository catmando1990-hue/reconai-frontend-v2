"use client";

import Header from "@/components/recon/Header";
import Sidebar from "@/components/recon/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/recon-shell.css";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="recon-app">
        <Sidebar />
        <div className="recon-main-content">
          <Header />
          <div className="recon-dashboard">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
