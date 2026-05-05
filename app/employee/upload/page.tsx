"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/query-client";
import { Loader2, UploadCloud, FileText, CalendarDays } from "lucide-react";

type UploadHistoryRow = {
  id: string;
  fileName: string;
  fileType: "EXCEL" | "CSV" | "HTML";
  asOnDate: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "PARTIAL_SUCCESS";
  rowCount: number | null;
  skippedRowCount: number | null;
  createdAt: string;
};

type StatementType = "LOAN_BALANCE" | "TRANSACTION";

function statusBadgeClass(status: UploadHistoryRow["status"]): string {
  if (status === "SUCCESS") return "bg-green-100 text-green-800 border-green-200";
  if (status === "FAILED") return "bg-red-100 text-red-700 border-red-200";
  if (status === "PARTIAL_SUCCESS") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EmployeeUploadPage() {
  const queryClient = useQueryClient();
  const [statementType, setStatementType] = useState<StatementType>("LOAN_BALANCE");
  const [asOnDate, setAsOnDate] = useState(todayIso());
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ["company-upload-history"],
    queryFn: () => apiFetch<UploadHistoryRow[]>("/api/company-upload/history"),
    refetchInterval: (query) => {
      const rows = (query.state.data ?? []) as UploadHistoryRow[];
      const hasActive = rows.some(
        (row) => row.status === "PENDING" || row.status === "PROCESSING"
      );
      return hasActive ? 5000 : false;
    },
  });

  const accept = ".xlsx,.xls,.csv";
  const hasActiveUploads = useMemo(
    () =>
      (historyQuery.data ?? []).some(
        (row) => row.status === "PENDING" || row.status === "PROCESSING"
      ),
    [historyQuery.data]
  );

  const onFileSelect = (selected: File | null) => {
    if (!selected) return;
    const lower = selected.name.toLowerCase();
    const valid = lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv");
    if (!valid) {
      setError("Only .xlsx, .xls, and .csv files are allowed.");
      return;
    }
    setError(null);
    setFile(selected);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    onFileSelect(event.dataTransfer.files?.[0] ?? null);
  };

  const onSubmit = async () => {
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    if (!asOnDate) {
      setError("Please choose an as-on date.");
      return;
    }

    const picked = new Date(asOnDate);
    const now = new Date();
    if (picked.getTime() > now.getTime()) {
      setError("As-on date cannot be in the future.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("as_on_date", asOnDate);
      formData.set("statement_type", statementType);

      const res = await fetch("/api/company-upload", {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!body.success) {
        throw new Error(body.error ?? "Upload failed.");
      }

      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["company-upload-history"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#c8e6c0] bg-white p-6">
        <h1 className="text-2xl font-bold text-[#064734]">Upload Data</h1>
        <p className="mt-1 text-sm text-[#4a7c5f]">
          Upload Loan Balance or Transaction spreadsheets for processing.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#4a7c5f]">
              Statement Type
            </span>
            <select
              value={statementType}
              onChange={(event) => setStatementType(event.target.value as StatementType)}
              className="w-full rounded-xl border border-[#c8e6c0] bg-white px-3 py-2 text-sm text-[#064734]"
            >
              <option value="LOAN_BALANCE">Loan Balance</option>
              <option value="TRANSACTION">Transaction</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#4a7c5f]">
              As-On Date
            </span>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#4a7c5f]" />
              <input
                type="date"
                value={asOnDate}
                max={todayIso()}
                onChange={(event) => setAsOnDate(event.target.value)}
                className="w-full rounded-xl border border-[#c8e6c0] bg-white py-2 pl-9 pr-3 text-sm text-[#064734]"
              />
            </div>
          </label>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={onDrop}
          className={`mt-5 rounded-2xl border-2 border-dashed p-8 text-center transition ${
            dragging ? "border-[#064734] bg-[#f0fce8]" : "border-[#c8e6c0] bg-[#f7fff0]"
          }`}
        >
          <UploadCloud className="mx-auto h-10 w-10 text-[#4a7c5f]" />
          <p className="mt-3 text-sm text-[#064734]">
            Drag and drop `.xlsx`, `.xls`, or `.csv` here
          </p>
          <p className="mt-1 text-xs text-[#4a7c5f]">or choose a file manually</p>
          <input
            type="file"
            accept={accept}
            onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
            className="mt-4 block w-full text-sm text-[#4a7c5f] file:mr-4 file:rounded-lg file:border-0 file:bg-[#064734] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          {file ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#c8e6c0] bg-white px-3 py-1.5 text-sm text-[#064734]">
              <FileText className="h-4 w-4" />
              {file.name}
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm text-[#991b1b]">{error}</p> : null}

        <div className="mt-5">
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#064734] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Upload
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#c8e6c0] bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#064734]">Upload History</h2>
          {hasActiveUploads ? (
            <span className="text-xs font-medium text-[#4a7c5f]">Polling every 5s</span>
          ) : null}
        </div>

        {historyQuery.isLoading ? (
          <div className="py-6 text-sm text-[#4a7c5f]">Loading history...</div>
        ) : (historyQuery.data ?? []).length === 0 ? (
          <div className="py-6 text-sm text-[#4a7c5f]">No uploads yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#c8e6c0] text-xs uppercase tracking-wide text-[#4a7c5f]">
                  <th className="px-2 py-2">File</th>
                  <th className="px-2 py-2">As-On Date</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Rows</th>
                  <th className="px-2 py-2">Skipped</th>
                  <th className="px-2 py-2">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {(historyQuery.data ?? []).map((row) => (
                  <tr key={row.id} className="border-b border-[#edf7e7] text-[#064734]">
                    <td className="px-2 py-2">{row.fileName}</td>
                    <td className="px-2 py-2">{row.asOnDate.slice(0, 10)}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(
                          row.status
                        )}`}
                      >
                        {row.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-2 py-2">{row.rowCount ?? "-"}</td>
                    <td className="px-2 py-2">{row.skippedRowCount ?? "-"}</td>
                    <td className="px-2 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
