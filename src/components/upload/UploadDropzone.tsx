"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";

export default function UploadDropzone() {
  const { apiFetch } = useApi();
  const [status, setStatus] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setStatus("Uploading...");
    const form = new FormData();
    form.append("file", file);

    await apiFetch("/upload", {
      method: "POST",
      body: form,
    });

    setStatus("Processing started");
  }

  return (
    <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
      <input
        type="file"
        accept=".csv,.pdf"
        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
      />
      {status && <p className="mt-4 text-sm">{status}</p>}
    </div>
  );
}
