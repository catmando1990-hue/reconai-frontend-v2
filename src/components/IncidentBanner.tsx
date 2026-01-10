// components/IncidentBanner.tsx
// Step 16: Incident Mode Banner for Frontend

"use client";

interface IncidentBannerProps {
  incident: boolean;
}

export function IncidentBanner({ incident }: IncidentBannerProps) {
  if (!incident) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "12px 16px",
        background: "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)",
        color: "white",
        fontSize: "14px",
        fontWeight: 600,
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      <span style={{ fontSize: "16px" }}>⚠️</span>
      <span>
        ReconAI is currently in maintenance / incident mode. Some features may
        be unavailable.
      </span>
    </div>
  );
}

export default IncidentBanner;
