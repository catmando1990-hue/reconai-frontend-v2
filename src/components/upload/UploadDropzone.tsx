"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";

// Security: File upload validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/pdf",
  "application/vnd.ms-excel",
];
const ALLOWED_EXTENSIONS = ["csv", "pdf"];

function validateFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Invalid file type: ${file.type}. Allowed: CSV, PDF`;
  }

  // Check file extension (defense in depth - MIME can be spoofed)
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }

  // Check for suspicious filename patterns
  if (
    file.name.includes("..") ||
    file.name.includes("/") ||
    file.name.includes("\\")
  ) {
    return "Invalid filename";
  }

  return null;
}

export default function UploadDropzone() {
  const { apiFetch } = useApi();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setError(null);

    // Validate file before upload
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setStatus("Uploading...");
    const form = new FormData();
    form.append("file", file);

    try {
      await apiFetch("/upload", {
        method: "POST",
        body: form,
      });
      setStatus("Processing started");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus(null);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
      <input
        type="file"
        accept=".csv,.pdf"
        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
      />
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {status && <p className="mt-4 text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}
