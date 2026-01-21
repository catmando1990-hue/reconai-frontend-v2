"use client";

import { useEffect, useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { apiFetch } from "@/lib/api";
import { FileText, AlertCircle, CheckCircle, Clock, Upload } from "lucide-react";

/**
 * Document type from backend API
 * Matches /api/documents endpoint response
 */
type Document = {
  id: string;
  organization_id: string;
  user_id: string;
  filename: string;
  content_type: string | null;
  file_size_bytes: number | null;
  source: string;
  source_endpoint: string | null;
  status: "uploaded" | "validated" | "processing" | "completed" | "failed";
  failure_reason: string | null;
  created_at: string;
  validated_at: string | null;
  processing_started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
};

type DocumentsResponse = {
  organization_id: string;
  documents: Document[];
  count: number;
};

/**
 * Status badge colors - direct mapping from backend status
 */
function getStatusStyle(status: Document["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "failed":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "processing":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "validated":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "uploaded":
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

function getStatusIcon(status: Document["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-3.5 w-3.5" />;
    case "failed":
      return <AlertCircle className="h-3.5 w-3.5" />;
    case "processing":
      return <Clock className="h-3.5 w-3.5 animate-pulse" />;
    case "validated":
    case "uploaded":
    default:
      return <Upload className="h-3.5 w-3.5" />;
  }
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function getSourceLabel(source: string): string {
  switch (source) {
    case "upload":
      return "Upload";
    case "receipt":
      return "Receipt";
    case "api":
      return "API";
    case "migration":
      return "Migration";
    default:
      return source;
  }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await apiFetch<DocumentsResponse>("/api/documents");
        if (alive) {
          setDocuments(data.documents || []);
        }
      } catch (err) {
        if (alive) {
          const msg = err instanceof Error ? err.message : "Failed to load documents";
          setError(msg);
          setDocuments([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <RouteShell
      title="Documents"
      subtitle="All uploaded documents and their processing status."
    >
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-card/20 rounded" />
          <div className="h-12 bg-card/20 rounded" />
          <div className="h-12 bg-card/20 rounded" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading documents</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-500/10 mb-4">
            <FileText className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-foreground font-medium mb-2">No Documents</h3>
          <p className="text-muted-foreground text-sm">
            No documents have been uploaded yet. Upload a CSV, PDF, or receipt
            to see it tracked here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-3 py-2 font-medium">Filename</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-border/30 hover:bg-card/30"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate max-w-[200px]">
                          {doc.filename}
                        </div>
                        {doc.content_type && (
                          <div className="text-xs text-muted-foreground truncate">
                            {doc.content_type}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border w-fit ${getStatusStyle(doc.status)}`}
                      >
                        {getStatusIcon(doc.status)}
                        {doc.status}
                      </span>
                      {doc.status === "failed" && doc.failure_reason && (
                        <span className="text-xs text-red-400 max-w-[200px] truncate">
                          {doc.failure_reason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-muted-foreground">
                      {getSourceLabel(doc.source)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-muted-foreground font-mono text-xs">
                      {formatBytes(doc.file_size_bytes)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-muted-foreground text-xs">
                      {formatDate(doc.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </RouteShell>
  );
}
