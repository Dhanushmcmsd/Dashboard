"use client";

import { useEffect, useState } from "react";
import { BRANCHES, BranchName } from "@/types";
import { cn } from "@/lib/utils";

type UploadStatus = {
  branch: BranchName;
  uploadedBy?: string;
  uploadedAt?: Date;
  status: "uploaded" | "pending";
};

type Props = {
  /** branches that have already uploaded today (from the snapshot) */
  initialUploaded: BranchName[];
  /** pass uploadedBy names from the snapshot, keyed by branch */
  initialUploaders?: Record<string, string>;
};

export default function LiveUploadFeed({ initialUploaded, initialUploaders = {} }: Props) {
  const [statuses, setStatuses] = useState<UploadStatus[]>(
    BRANCHES.map((b) => ({
      branch: b,
      status: initialUploaded.includes(b) ? "uploaded" : "pending",
      uploadedBy: initialUploaders[b],
    }))
  );

  useEffect(() => {
    const es = new EventSource("/api/events");

    es.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "upload-complete") {
          setStatuses((prev) =>
            prev.map((s) =>
              s.branch === data.branch
                ? { ...s, status: "uploaded", uploadedBy: data.uploadedBy, uploadedAt: new Date() }
                : s
            )
          );
        }
      } catch {
        // ignore
      }
    });

    return () => es.close();
  }, []);

  const uploaded = statuses.filter((s) => s.status === "uploaded");
  const pending = statuses.filter((s) => s.status === "pending");

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Live Upload Status</h3>
        <span className="text-xs text-text-muted">
          {uploaded.length}/{BRANCHES.length} uploaded
        </span>
      </div>

      <ul className="space-y-2.5">
        {statuses.map((s) => (
          <li key={s.branch} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  s.status === "uploaded" ? "bg-success animate-none" : "bg-text-muted animate-pulse"
                )}
              />
              <span className="text-sm text-text-primary">{s.branch}</span>
            </div>
            <span className="text-xs text-text-muted text-right">
              {s.status === "uploaded" && s.uploadedBy
                ? `by ${s.uploadedBy}${
                    s.uploadedAt
                      ? ` · ${Math.round((Date.now() - s.uploadedAt.getTime()) / 60000)} min ago`
                      : ""
                  }`
                : s.status === "uploaded"
                ? "✓ Uploaded"
                : "⏳ Pending"}
            </span>
          </li>
        ))}
      </ul>

      {pending.length === 0 && (
        <p className="mt-3 text-xs text-success text-center">✅ All branches uploaded today</p>
      )}
    </div>
  );
}
