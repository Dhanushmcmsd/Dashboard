"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function UploadPage() {
  const branch = useSearchParams().get("branch") || "";
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  async function onUpload() {
    if (!file || !branch) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("branch", branch);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    setMsg(json.success ? "Uploaded" : json.error);
  }
  return <div><h1 className="text-xl font-bold mb-4">Upload - {branch}</h1><input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-3" /><button className="bg-primary text-white px-4 py-2 rounded" onClick={onUpload}>Upload</button><p className="mt-3 text-sm">{msg}</p></div>;
}
