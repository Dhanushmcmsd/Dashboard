"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRANCHES } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, apiFetch } from "@/lib/query-client";
import { UploadRecord } from "@/types";
import { toast } from "sonner";
import { UploadCloud, FileType, X, Loader2, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchRaw = searchParams.get("branch");
  const branch = BRANCHES.find(b => b === branchRaw);

  const qc = useQueryClient();
  const [fileType, setFileType] = useState<"EXCEL" | "HTML">("EXCEL");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: [...QUERY_KEYS.UPLOAD_HISTORY, branch],
    queryFn: () => apiFetch<UploadRecord[]>(`/api/upload/history?branch=${encodeURIComponent(branch || "")}`),
    enabled: !!branch,
  });

  if (!branch) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-danger">Invalid Branch Selection</h2>
        <Link href="/employee" className="text-primary hover:underline mt-4 inline-block">Return to branch selection</Link>
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const name = selectedFile.name.toLowerCase();
    if (fileType === "EXCEL" && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx)");
      return;
    }
    if (fileType === "HTML" && !name.endsWith(".html") && !name.endsWith(".htm")) {
      toast.error("Please upload an HTML file (.html)");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("branch", branch);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Upload failed");
      } else {
        toast.success("File uploaded and parsed successfully");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        qc.invalidateQueries({ queryKey: [...QUERY_KEYS.UPLOAD_HISTORY, branch] });
      }
    } catch (err) {
      toast.error("An unexpected error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link href="/employee" className="inline-flex items-center text-sm text-text-muted hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Branches
        </Link>
        <h2 className="text-2xl font-bold text-text-primary">Upload Data for {branch}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-text-primary">Data File</h3>
              
              <div className="flex bg-elevated p-1 rounded-lg">
                <button
                  onClick={() => { setFileType("EXCEL"); setFile(null); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${fileType === "EXCEL" ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-text-primary"}`}
                >
                  Excel
                </button>
                <button
                  onClick={() => { setFileType("HTML"); setFile(null); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${fileType === "HTML" ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-text-primary"}`}
                >
                  HTML
                </button>
              </div>
            </div>

            {!file ? (
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
                  ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-text-muted/50 hover:bg-elevated/50"}`}
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
                <UploadCloud className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-primary font-medium mb-1">
                  Click or drag file to this area to upload
                </p>
                <p className="text-sm text-text-muted">
                  Support for a single {fileType === "EXCEL" ? "Excel" : "HTML"} upload. Maximum file size 5MB.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-xl p-6 flex flex-col items-center justify-center bg-elevated/30">
                <div className="w-16 h-16 bg-surface border border-border rounded-xl flex items-center justify-center mb-4 text-primary">
                  <FileType className="w-8 h-8" />
                </div>
                <p className="font-medium text-text-primary">{file.name}</p>
                <p className="text-sm text-text-muted mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                
                <div className="flex items-center gap-3 w-full max-w-xs">
                  <button
                    onClick={() => setFile(null)}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 bg-surface hover:bg-elevated border border-border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex justify-center items-center disabled:opacity-70"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload Now"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-surface border border-border rounded-xl p-6 sticky top-24">
            <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-text-muted" />
              Recent Uploads
            </h3>
            
            {historyLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : !history || history.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">No recent uploads for this branch.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((record) => (
                  <div key={record.id} className="p-3 bg-elevated rounded-lg border border-border/50 text-sm">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-text-primary truncate pr-2" title={record.fileName}>
                        {record.fileName}
                      </span>
                      <span className="text-[10px] bg-surface px-1.5 py-0.5 rounded text-text-muted shrink-0">
                        {record.fileType}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mb-1">
                      {format(new Date(record.uploadedAt), "MMM d, yyyy h:mm a")}
                    </p>
                    <p className="text-xs text-primary/80">By {record.uploadedByName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
