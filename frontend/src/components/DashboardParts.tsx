import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useAlerts, useBranches, useBuckets, useClosedLoans, useDashboardKPIs, useDisbursement, useHighRisk, useNewCustomers, useNPAData, useUploadHistory } from "../hooks/dashboard";

export function KPIGrid({ companyId, portfolioType, period }: any) {
  const { data } = useDashboardKPIs(companyId, portfolioType, period);
  const entries = Object.entries(data || {}).slice(0, 13);
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{entries.map(([k, v]) => <div key={k} className="border p-3 rounded"><div className="text-xs">{k}</div><div className="font-bold">{String(v)}</div></div>)}</div>;
}
export function DisbursementCollectionSection({ companyId, portfolioType, period }: any) { useDisbursement(companyId, portfolioType, period); const d=[{n:"A",d:10,c:9}]; return <ResponsiveContainer width="100%" height={200}><BarChart data={d}><XAxis dataKey="n"/><YAxis/><Bar dataKey="d" fill="#0ea5e9"/><Bar dataKey="c" fill="#22c55e"/></BarChart></ResponsiveContainer>; }
export function BucketOverdueTable({ companyId, portfolioType, period }: any) { useBuckets(companyId, portfolioType, period); return <div className="border p-3 rounded">Buckets loaded</div>; }
export function NewCustomersSection({ companyId, portfolioType, period }: any) { useNewCustomers(companyId, portfolioType, period); return <div className="border p-3 rounded">New customers</div>; }
export function ClosedLoansSection({ companyId, portfolioType, period }: any) { useClosedLoans(companyId, portfolioType, period); return <div className="border p-3 rounded">Closed loans</div>; }
export function HighRiskTable({ companyId, portfolioType, period }: any) { useHighRisk(companyId, portfolioType, period); return <div className="border p-3 rounded">High risk</div>; }
export function NPARiskSection({ companyId, portfolioType, period }: any) { const { data } = useNPAData(companyId, portfolioType, period); const d=[{name:"NPA",value:data?.gnpa_amount||0},{name:"Other",value:Math.max((data?.total_aum||0)-(data?.gnpa_amount||0),0)}]; return <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={d} dataKey="value" nameKey="name" outerRadius={70}><Cell fill="#ef4444"/><Cell fill="#94a3b8"/></Pie></PieChart></ResponsiveContainer>; }
export function BranchPerformanceTable({ companyId, portfolioType, period }: any) { useBranches(companyId, portfolioType, period); return <div className="border p-3 rounded">Branch performance</div>; }
export function AlertsPanel({ companyId, portfolioType, period }: any) { const { data } = useAlerts(companyId, portfolioType, period); return <div className="border p-3 rounded">Alerts: {Array.isArray(data) ? data.length : 0}</div>; }
export function UploadPanel() { const { data } = useUploadHistory(); const d = Array.isArray(data) ? data : []; return <div className="border p-3 rounded">Uploads: {d.length}</div>; }
export function TrendLine() { const d=[{x:"D1",y:5},{x:"D2",y:7}]; return <ResponsiveContainer width="100%" height={200}><LineChart data={d}><XAxis dataKey="x"/><YAxis/><Line type="monotone" dataKey="y" stroke="#f59e0b"/></LineChart></ResponsiveContainer>; }
