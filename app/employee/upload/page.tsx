"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRANCHES } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, apiFetch } from "@/lib/query-client";
import { UploadRecord } from "@/types";
import { toast } from "sonner";
import {
  UploadCloud,
  X,
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatINRCompact, getTodayKey } from "@/lib/utils";

type UploadState =
  | "idle"
  | "file-selected"
  | "previewing"
  | "preview-ready"
  | "preview-error"
  | "uploading"
  | "done";

interface PreviewData {
  closingBalance: number;
  disbursement: number;
  collection: number;
  npa: number;
  totalAccounts: number | null;
  reportDateRange: string | null;
  fileType: string;
  fileName: string;
  branch: string;
}

interface DuplicateRecord {
  uploadedAt: string;
  fileName: string;
}

export default function UploadPage() {
  const searchParams = useSearchParams();
  const branchRaw = searchParams.get("branch");
  const branch = BRANCHES.find((b) => b === branchRaw);

  const qc = useQueryClient();
  const [fileType, setFileType] = useState<"EXCEL" | "HTML">("EXCEL");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [duplicateRecord, setDuplicateRecord] = useState<DuplicateRecord | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: [...QUERY_KEYS.UPLOAD_HISTORY, branch],
    queryFn: () =>
      apiFetch<UploadRecord[]>(
        `/api/upload/history?branch=${encodeURIComponent(branch || "")}`
      ),
    enabled: !!branch,
  });

  if (!branch) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-[#991b1b]">Invalid Branch Selection</h2>
        <Link href="/employee" className="text-[#064734] hover:underline mt-4 inline-block font-medium">
          Return to branch selection
        </Link>
      </div>
    );
  }

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const fetchPreview = async (selectedFile: File) => {
    setUploadState("previewing");
    setPreview(null);
    setPreviewError(null);
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("branch", branch);
    try {
      const res  = await fetch("/api/upload/preview", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) {
        setPreviewError(json.error || "Failed to parse file.");
        setUploadState("preview-error");
      } else {
        setPreview(json.data);
        setUploadState("preview-ready");
      }
    } catch {
      setPreviewError("Network error. Could not reach the server.");
      setUploadState("preview-error");
    }
  };

  const acceptFile = (selectedFile: File) => {
    const todayKey  = getTodayKey();
    const duplicate = history?.find((r) => r.dateKey === todayKey);
    if (duplicate) {
      pendingFileRef.current = selectedFile;
      setDuplicateRecord({ uploadedAt: duplicate.uploadedAt, fileName: duplicate.fileName });
      return;
    }
    setFile(selectedFile);
    setUploadState("file-selected");
    fetchPreview(selectedFile);
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) { toast.error("File size exceeds 5MB limit", { position: "bottom-right" }); return; }
    const name = selectedFile.name.toLowerCase();
    if (fileType === "EXCEL" && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx)", { position: "bottom-right" }); return;
    }
    if (fileType === "HTML" && !name.endsWith(".html") && !name.endsWith(".htm")) {
      toast.error("Please upload an HTML file (.html)", { position: "bottom-right" }); return;
    }
    acceptFile(selectedFile);
  };

  const handleReplaceConfirm = () => {
    const pending = pendingFileRef.current;
    setDuplicateRecord(null);
    pendingFileRef.current = null;
    if (!pending) return;
    setFile(pending);
    setUploadState("file-selected");
    fetchPreview(pending);
  };

  const handleReplaceCancel = () => {
    setDuplicateRecord(null);
    pendingFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) validateAndSetFile(e.target.files[0]);
  };

  const resetFile = () => {
    setFile(null); setPreview(null); setPreviewError(null); setUploadState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadState("uploading");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("branch", branch);
    try {
      const res  = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Upload failed", { position: "bottom-right" });
        setUploadState("preview-ready");
      } else {
        toast.success("File uploaded and parsed successfully", { position: "bottom-right" });
        setUploadState("done");
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        qc.invalidateQueries({ queryKey: [...QUERY_KEYS.UPLOAD_HISTORY, branch] });
        setTimeout(() => setUploadState("idle"), 2000);
      }
    } catch {
      toast.error("An unexpected error occurred during upload", { position: "bottom-right" });
      setUploadState("preview-ready");
    }
  };

  const isUploading = uploadState === "uploading";
  const showDropzone = uploadState === "idle" || uploadState === "file-selected";

  return (
    <>
      {/* ── Duplicate upload warning modal ── */}
      {duplicateRecord && (
        <div className="fixed inset-0 bg-[#064734]/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border border-[#f0c27f] rounded-2xl p-6 max-w-md w-full mx-4 shadow-[0_12px_40px_rgba(6,71,52,0.15)]">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-[#064734] font-semibold text-base">Already Uploaded Today</h3>
                <p className="text-[#4a7c5f] text-sm mt-1">
                  You uploaded{" "}
                  <span className="text-[#064734] font-medium">{duplicateRecord.fileName}</span>{" "}
                  at{" "}
                  <span className="text-[#064734] font-medium">
                    {format(new Date(duplicateRecord.uploadedAt), "h:mm a")}
                  </span>
                  . Uploading again will{" "}
                  <span className="text-amber-600 font-medium">replace today's data</span> for this branch.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button onClick={handleReplaceConfirm} className="flex-1 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-xl text-sm font-semibold transition-colors">
                Replace Anyway
              </button>
              <button onClick={handleReplaceCancel} className="flex-1 px-4 py-2.5 bg-white hover:bg-[#f7fff0] border border-[#c8e6c0] text-[#064734] rounded-xl text-sm font-semibold transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main page ── */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <Link href="/employee" className="inline-flex items-center text-sm text-[#4a7c5f] hover:text-[#064734] transition-colors mb-4 font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Branches
          </Link>
          <h2 className="text-2xl font-bold text-[#064734]">Upload Data for {branch}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#c8e6c0] rounded-2xl p-6 shadow-[0_4px_24px_rgba(6,71,52,0.06)]">
              {/* File type toggle */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#064734]">Data File</h3>
                <div className="flex bg-[#f7fff0] border border-[#c8e6c0] p-1 rounded-xl">
                  <button
                    onClick={() => { setFileType("EXCEL"); resetFile(); }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                      fileType === "EXCEL"
                        ? "bg-[#064734] text-white shadow-sm"
                        : "text-[#4a7c5f] hover:text-[#064734]"
                    }`}
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => { setFileType("HTML"); resetFile(); }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                      fileType === "HTML"
                        ? "bg-[#064734] text-white shadow-sm"
                        : "text-[#4a7c5f] hover:text-[#064734]"
                    }`}
                  >
                    HTML
                  </button>
                </div>
              </div>

              {/* Dropzone */}
              {showDropzone && (
                <div
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors duration-150 cursor-pointer ${
                    isDragging
                      ? "border-[#064734] bg-[#E0FFC2]/30"
                      : "border-[#c8e6c0] hover:border-[#064734]/40 hover:bg-[#f7fff0]"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={fileType === "EXCEL" ? ".xlsx,.xls" : ".html,.htm"}
                    onChange={handleFileChange}
                  />
                  <UploadCloud className="w-12 h-12 text-[#4a7c5f] mx-auto mb-4" />
                  <p className="text-[#064734] font-semibold mb-1">Click or drag file to upload</p>
                  <p className="text-sm text-[#4a7c5f]">
                    Single {fileType === "EXCEL" ? "Excel" : "HTML"} file — max 5 MB
                  </p>
                </div>
              )}

              {/* Skeleton while previewing */}
              {uploadState === "previewing" && (
                <div className="border border-[#c8e6c0] rounded-2xl p-5 space-y-4">
                  <div className="h-4 bg-[#f0fce8] rounded w-2/5 animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-[#f0fce8] rounded-xl animate-pulse" />
                    ))}
                  </div>
                  <div className="h-4 bg-[#f0fce8] rounded w-1/3 animate-pulse" />
                  <div className="flex gap-3">
                    <div className="h-10 bg-[#f0fce8] rounded-xl flex-1 animate-pulse" />
                    <div className="h-10 bg-[#f0fce8] rounded-xl flex-1 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Preview error */}
              {uploadState === "preview-error" && previewError && (
                <div className="border border-[#fca5a5] bg-red-50 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-[#991b1b] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#991b1b] mb-1">Could not parse file</p>
                      <p className="text-sm text-[#991b1b]/80">{previewError}</p>
                    </div>
                  </div>
                  <button
                    onClick={resetFile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#f7fff0] border border-[#c8e6c0] rounded-xl text-sm font-semibold text-[#064734] transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" /> Choose Different File
                  </button>
                </div>
              )}

              {/* Preview ready */}
              {(uploadState === "preview-ready" || uploadState === "uploading") && preview && (
                <div className="border border-[#c8e6c0] bg-[#f7fff0] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                    <p className="text-sm font-semibold text-[#064734]">Parsed Preview — looks correct?</p>
                    {file && (
                      <span className="ml-auto text-xs text-[#4a7c5f] bg-white px-2 py-0.5 rounded-lg border border-[#c8e6c0]">
                        {file.name}
                      </span>
                    )}
                  </div>

                  {/* Metric grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-[#c8e6c0] rounded-xl p-3">
                      <p className="text-xs text-[#4a7c5f] mb-1 uppercase tracking-widest font-medium">Closing Balance</p>
                      <p className="text-base font-bold text-[#064734] tabular-nums">{formatINRCompact(preview.closingBalance)}</p>
                    </div>
                    <div className="bg-white border border-[#c8e6c0] rounded-xl p-3">
                      <p className="text-xs text-[#4a7c5f] mb-1 uppercase tracking-widest font-medium">Collection</p>
                      <p className="text-base font-bold text-[#064734] tabular-nums">{formatINRCompact(preview.collection)}</p>
                    </div>
                    <div className="bg-white border border-[#c8e6c0] rounded-xl p-3">
                      <p className="text-xs text-[#4a7c5f] mb-1 uppercase tracking-widest font-medium">Disbursement</p>
                      <p className="text-base font-bold text-[#064734] tabular-nums">{formatINRCompact(preview.disbursement)}</p>
                    </div>
                    <div className="bg-white border border-[#c8e6c0] rounded-xl p-3">
                      <p className="text-xs text-[#4a7c5f] mb-1 uppercase tracking-widest font-medium">NPA</p>
                      <p className="text-base font-bold text-[#991b1b] tabular-nums">{formatINRCompact(preview.npa)}</p>
                    </div>
                  </div>

                  {(preview.totalAccounts || preview.reportDateRange) && (
                    <div className="flex flex-wrap gap-3">
                      {preview.totalAccounts && (
                        <span className="text-xs bg-white border border-[#c8e6c0] rounded-lg px-2.5 py-1 text-[#4a7c5f] font-medium">
                          {preview.totalAccounts} Accounts
                        </span>
                      )}
                      {preview.reportDateRange && (
                        <span className="text-xs bg-white border border-[#c8e6c0] rounded-lg px-2.5 py-1 text-[#4a7c5f] font-medium">
                          {preview.reportDateRange}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 px-4 py-2.5 bg-[#064734] hover:bg-[#053d2a] disabled:opacity-70 text-white rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2"
                    >
                      {isUploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</>
                      ) : (
                        "Upload Now"
                      )}
                    </button>
                    <button
                      onClick={resetFile}
                      disabled={isUploading}
                      className="flex-1 px-4 py-2.5 bg-white hover:bg-[#f7fff0] border border-[#c8e6c0] text-[#064734] rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      Choose Different File
                    </button>
                  </div>
                </div>
              )}

              {/* Done state */}
              {uploadState === "done" && (
                <div className="border border-[#c8e6c0] bg-[#f7fff0] rounded-2xl p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-[#22c55e] mx-auto mb-3" />
                  <p className="font-bold text-[#064734]">Upload successful!</p>
                  <p className="text-sm text-[#4a7c5f] mt-1">Data for {branch} has been recorded.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent uploads sidebar */}
          <div>
            <div className="bg-white border border-[#c8e6c0] rounded-2xl p-6 sticky top-24 shadow-[0_4px_24px_rgba(6,71,52,0.06)]">
              <h3 className="text-base font-semibold text-[#064734] mb-4 flex items-center uppercase tracking-widest text-xs">
                <Clock className="w-4 h-4 mr-2 text-[#4a7c5f]" />
                Recent Uploads
              </h3>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#064734]" />
                </div>
              ) : !history || history.length === 0 ? (
                <p className="text-sm text-[#4a7c5f] text-center py-8">No recent uploads for this branch.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((record) => (
                    <div key={record.id} className="p-3 bg-[#f7fff0] border border-[#c8e6c0] rounded-xl text-sm hover:bg-[#f0fce8] transition-colors duration-150">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-semibold text-[#064734] truncate pr-2" title={record.fileName}>
                          {record.fileName}
                        </span>
                        <span className="text-[10px] bg-white border border-[#c8e6c0] px-1.5 py-0.5 rounded-lg text-[#4a7c5f] shrink-0">
                          {record.fileType}
                        </span>
                      </div>
                      <p className="text-xs text-[#4a7c5f] mb-1">
                        {format(new Date(record.uploadedAt), "MMM d, yyyy h:mm a")}
                      </p>
                      <p className="text-xs text-[#064734]/70 font-medium">By {record.uploadedByName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
