"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback, useRef } from "react";
import type { CSSProperties, DragEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BRANCHES, BRANCH_COLORS } from "@/lib/constants";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import type { BranchName, UploadRecord } from "@/types";

type FileTypeTab = "EXCEL" | "HTML";
type UploadVars = CSSProperties & {
  "--accent": string;
  "--accent-bg": string;
  "--accent-border": string;
  "--drop-bg": string;
  "--drop-border": string;
  "--file-icon-bg": string;
};

export default function UploadPage() {
  const params = useSearchParams();
  const router = useRouter();
  const branchParam = params.get("branch");
  const branch = BRANCHES.find((b) => b === branchParam) as BranchName | undefined;
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileType, setFileType] = useState<FileTypeTab>("EXCEL");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: history = [], refetch } = useQuery({
    queryKey: QUERY_KEYS.uploadHistory(),
    queryFn: () => apiFetch<UploadRecord[]>("/api/upload/history"),
  });

  const recentForBranch = history.filter((h) => h.branch === branch).slice(0, 5);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  async function handleUpload() {
    if (!file || !branch) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("branch", branch);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json() as { success: boolean; error?: string };
    setLoading(false);

    if (data.success) {
      toast.success(`${branch} data uploaded successfully`);
      setFile(null);
      refetch();
    } else {
      toast.error(data.error ?? "Upload failed. Please try again.");
    }
  }

  if (!branch) {
    return (
      <div>
        <p className="text-danger">
          Invalid branch.{" "}
          <button onClick={() => router.back()} className="text-primary underline">Go back</button>
        </p>
      </div>
    );
  }

  const accent = BRANCH_COLORS[branch] ?? "#4F6EF7";
  const vars: UploadVars = {
    "--accent": accent,
    "--accent-bg": `${accent}20`,
    "--accent-border": `${accent}40`,
    "--drop-bg": dragging ? `${accent}08` : "transparent",
    "--drop-border": dragging ? accent : "#2A2D3A",
    "--file-icon-bg": file ? `${accent}20` : "#2A2D3A",
  };

  return (
    <div style={vars}>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-text-muted hover:text-text-main text-sm transition mb-6"
      >
        Back to branches
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-[var(--accent-bg)] border border-[var(--accent-border)]">
          📁
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-main">Upload - {branch}</h1>
          <p className="text-text-muted text-xs">Upload today&apos;s financial data file</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-surface border border-border rounded-xl p-1 w-fit">
        {(["EXCEL", "HTML"] as FileTypeTab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setFileType(t);
              setFile(null);
            }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              fileType === t ? "bg-[var(--accent)] text-white" : "text-text-muted hover:text-text-main"
            }`}
          >
            {t === "EXCEL" ? "Excel" : "HTML"}
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed border-[var(--drop-border)] bg-[var(--drop-bg)] rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-1 bg-[var(--file-icon-bg)]">
          {file ? "✓" : "📁"}
        </div>

        {file ? (
          <div className="text-center">
            <p className="text-text-main font-semibold">{file.name}</p>
            <p className="text-text-muted text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="mt-2 text-danger text-xs hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-text-main font-medium">Drag and drop or click to browse</p>
            <p className="text-text-muted text-xs mt-1">
              {fileType === "EXCEL" ? ".xlsx or .xls files" : ".html or .htm files"} · Max 10 MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={fileType === "EXCEL" ? ".xlsx,.xls" : ".html,.htm"}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-5 w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-40 flex items-center justify-center gap-2 bg-[var(--accent)] hover:opacity-90"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Uploading...
          </>
        ) : "Upload File"}
      </button>

      {recentForBranch.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">
            Recent uploads - {branch}
          </h3>
          <div className="space-y-2">
            {recentForBranch.map((u) => (
              <div key={u.id} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-text-main text-sm font-medium">{u.fileName}</p>
                  <p className="text-text-muted text-xs mt-0.5">{u.fileType} · {u.dateKey}</p>
                </div>
                <span className="bg-success/15 text-success text-xs font-medium px-2.5 py-1 rounded-full">Uploaded</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
