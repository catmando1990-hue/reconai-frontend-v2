"use client";

import { useEffect, useState } from "react";
import { auditedFetch } from "@/lib/auditedFetch";

type Persona = {
  name: string;
  address_name: string;
  intro_briefing: string;
};

export function ReconAIBriefing() {
  const [persona, setPersona] = useState<Persona | null>(null);

  useEffect(() => {
    // Assumes your frontend proxy routes /api to backend, or swap to NEXT_PUBLIC_API_URL.
    auditedFetch<Persona & { request_id: string }>("/api/ai/identity")
      .then(setPersona)
      .catch(() => setPersona(null));
  }, []);

  if (!persona) return null;

  return (
    <div className="rounded-2xl border p-4 md:p-6">
      <div className="text-lg font-semibold">{persona.name} Briefing</div>
      <pre className="mt-3 whitespace-pre-wrap text-sm opacity-90">
        {persona.intro_briefing}
      </pre>
    </div>
  );
}
