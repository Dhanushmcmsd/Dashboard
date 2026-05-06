import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export const useDashboardKPIs = (companyId: string, portfolioType: string, period: string) => useQuery({ queryKey: ["kpis", companyId, portfolioType, period], queryFn: async () => (await api.get(`/dashboard/${companyId}/${portfolioType}/kpis`, { params: { period } })).data });
export const useDisbursement = (companyId: string, portfolioType: string, period: string) => useQuery({ queryKey: ["disb", companyId, portfolioType, period], queryFn: async () => (await api.get(`/dashboard/${companyId}/${portfolioType}/disbursement-trend`, { params: { period } })).data });
export const useBuckets = (companyId: string, portfolioType: string, period: string) => useQuery({ queryKey: ["buckets", companyId, portfolioType, period], queryFn: async () => (await api.get(`/dashboard/${companyId}/${portfolioType}/buckets`, { params: { period } })).data });
export const useHighRisk = (companyId: string, portfolioType: string, period: string) => useQuery({ queryKey: ["risk", companyId, portfolioType, period], queryFn: async () => (await api.get(`/dashboard/${companyId}/${portfolioType}/high-risk`, { params: { period } })).data });
export const useNPAData = (companyId: string, portfolioType: string, period: string) => useDashboardKPIs(companyId, portfolioType, period);
export const useBranches = (companyId: string, portfolioType: string, period: string) => useQuery({ queryKey: ["branches", companyId, portfolioType, period], queryFn: async () => (await api.get(`/dashboard/${companyId}/${portfolioType}/branches`, { params: { period } })).data });
export const useAlerts = (companyId: string, portfolioType: string, period: string) => useQuery({ queryKey: ["alerts", companyId, portfolioType, period], queryFn: async () => (await api.get(`/dashboard/${companyId}/${portfolioType}/alerts`, { params: { period } })).data });
export const useUploadHistory = () => useQuery({ queryKey: ["uploads"], queryFn: async () => (await api.get("/uploads")).data });
export const useUploadStatus = (uploadId?: string) => useQuery({ queryKey: ["upload-status", uploadId], queryFn: async () => (await api.get(`/uploads/${uploadId}/status`)).data, enabled: !!uploadId, refetchInterval: 3000 });
export const useNewCustomers = (companyId: string, portfolioType: string, period: string) => useDashboardKPIs(companyId, portfolioType, period);
export const useClosedLoans = (companyId: string, portfolioType: string, period: string) => useDashboardKPIs(companyId, portfolioType, period);
