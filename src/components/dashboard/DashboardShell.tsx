"use client";

import React from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-1px)] w-full">
      <div className="flex flex-col md:flex-row">
        <DashboardSidebar />
        <div className="flex-1">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
