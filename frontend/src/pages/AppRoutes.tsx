import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../api/client";
import { AlertsPanel, BranchPerformanceTable, BucketOverdueTable, ClosedLoansSection, DisbursementCollectionSection, HighRiskTable, KPIGrid, NewCustomersSection, NPARiskSection, UploadPanel } from "../components/DashboardParts";

const qc = new QueryClient();
const companies = ["supra-pacific", "ideal-supermarket", "cfcici", "central-bazar", "centora", "central-bio-fuel"];

function Login() { return <div className="p-6">/login</div>; }
function CompanySelector() { return <div className="grid grid-cols-2 gap-3 p-6">{companies.map((s) => <a className="border rounded p-4" href={`/${s}`} key={s}>{s}</a>)}</div>; }
function CompanyHome() { const { companySlug } = useParams(); return <div className="p-6"><h1>{companySlug}</h1><a href={`/${companySlug}/gold-loan`}>Gold Loan</a></div>; }
function Placeholder() { return <div className="p-6">No data yet</div>; }
function DashboardPage() { const { companySlug } = useParams(); const [period, setPeriod] = useState("ftd"); const companyId = crypto.randomUUID(); const portfolioType = "gold_loan"; return <div className="p-6 space-y-4"><div className="flex gap-2">{["ftd","mtd","ytd"].map((p)=><button key={p} className="border px-3 py-1" onClick={()=>setPeriod(p)}>{p.toUpperCase()}</button>)}</div><KPIGrid companyId={companyId} portfolioType={portfolioType} period={period}/><DisbursementCollectionSection companyId={companyId} portfolioType={portfolioType} period={period}/><BucketOverdueTable companyId={companyId} portfolioType={portfolioType} period={period}/><NewCustomersSection companyId={companyId} portfolioType={portfolioType} period={period}/><ClosedLoansSection companyId={companyId} portfolioType={portfolioType} period={period}/><HighRiskTable companyId={companyId} portfolioType={portfolioType} period={period}/><NPARiskSection companyId={companyId} portfolioType={portfolioType} period={period}/><BranchPerformanceTable companyId={companyId} portfolioType={portfolioType} period={period}/><AlertsPanel companyId={companyId} portfolioType={portfolioType} period={period}/><UploadPanel/></div>; }
function UploadPage() { const [status, setStatus] = useState(""); const dz = useDropzone({ onDrop: async (files) => { const f = files[0]; if (!f) return; const fd = new FormData(); fd.append("file", f); fd.append("portfolioId", crypto.randomUUID()); fd.append("statementDate", new Date().toISOString().slice(0,10)); const r = await api.post("/uploads/loan-balance", fd); const id = r.data.upload_id; const timer = setInterval(async () => { const s = (await api.get(`/uploads/${id}/status`)).data; setStatus(s.status); if (["success","failed"].includes(s.status)) clearInterval(timer); }, 3000); } }); return <div className="p-6"><div {...dz.getRootProps()} className="border-dashed border-2 p-10"><input {...dz.getInputProps()}/>Drop files</div><div>{status}</div></div>; }

export default function AppRoutes() {
  return <QueryClientProvider client={qc}><BrowserRouter><Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/" element={<CompanySelector/>}/>
    <Route path="/:companySlug" element={<CompanyHome/>}/>
    <Route path="/:companySlug/gold-loan" element={<DashboardPage/>}/>
    <Route path="/:companySlug/pledge-loan" element={<Placeholder/>}/>
    <Route path="/:companySlug/ml-loan" element={<Placeholder/>}/>
    <Route path="/:companySlug/personal-loan" element={<Placeholder/>}/>
    <Route path="/:companySlug/vehicle-loan" element={<Placeholder/>}/>
    <Route path="/upload" element={<UploadPage/>}/>
    <Route path="/admin/users" element={<div className='p-6'>Admin users</div>}/>
    <Route path="/admin/companies" element={<div className='p-6'>Admin companies</div>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter></QueryClientProvider>;
}
