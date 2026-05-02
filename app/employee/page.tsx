"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Building2, ShoppingCart, Coins, TrendingUp, CarFront, UserCircle2, Bell, Loader2 } from "lucide-react";
import { BRANCHES } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/query-client";
import { format } from "date-fns";

interface Alert {
  id: string;
  message: string;
  sentByName: string;
  sentAt: string;
}

const getBranchIcon = (branch: string) => {
  switch (branch) {
    case "Supermarket":   return <ShoppingCart className="w-8 h-8" />;
    case "Gold Loan":     return <Coins         className="w-8 h-8" />;
    case "ML Loan":       return <TrendingUp     className="w-8 h-8" />;
    case "Vehicle Loan":  return <CarFront       className="w-8 h-8" />;
    case "Personal Loan": return <UserCircle2    className="w-8 h-8" />;
    default:              return <Building2      className="w-8 h-8" />;
  }
};

export default function EmployeeHomePage() {
  const { data: session } = useSession();
  const userBranches = session?.user?.branches || [];

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["employee-alerts"],
    queryFn: () => apiFetch<Alert[]>("/api/alerts"),
    refetchInterval: 60 * 1000,
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Two-column layout */}
      <div className="flex flex-col xl:flex-row gap-8">

        {/* ── Branch selection ── */}
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-[#064734]">Select Branch</h2>
            <p className="text-[#4a7c5f] mt-2 text-lg">Choose a branch to upload today's data.</p>
          </div>

          {userBranches.length === 0 ? (
            <div className="bg-white border border-[#c8e6c0] rounded-2xl p-12 text-center shadow-[0_4px_24px_rgba(6,71,52,0.06)]">
              <Building2 className="w-12 h-12 text-[#4a7c5f] mx-auto mb-4 opacity-40" />
              <h3 className="text-xl font-semibold text-[#064734] mb-2">No Branches Assigned</h3>
              <p className="text-[#4a7c5f] max-w-md mx-auto">
                You don't have any branches assigned to your account.
                Please contact your administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BRANCHES.filter((b) => userBranches.includes(b)).map((branch) => (
                <Link
                  key={branch}
                  href={`/employee/upload?branch=${encodeURIComponent(branch)}`}
                  className="group bg-white border border-[#c8e6c0] hover:border-[#064734]/40 hover:shadow-[0_8px_32px_rgba(6,71,52,0.10)] rounded-2xl p-6 transition-all duration-200 relative overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E0FFC2]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl" />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-14 h-14 bg-[#f0fce8] group-hover:bg-[#c8e6c0]/60 group-hover:text-[#064734] rounded-xl flex items-center justify-center text-[#4a7c5f] transition-colors duration-200 mb-6">
                      {getBranchIcon(branch)}
                    </div>
                    <h3 className="text-xl font-semibold text-[#064734] mb-2">{branch}</h3>
                    <p className="text-[#4a7c5f] text-sm flex-1">
                      Upload daily data sheets for {branch} branch operations.
                    </p>
                    <div className="mt-6 flex items-center text-sm font-semibold text-[#064734] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      Proceed to Upload &rarr;
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Alerts sidebar ── */}
        <div className="w-full xl:w-80 shrink-0">
          <div className="bg-white border border-[#c8e6c0] rounded-2xl overflow-hidden sticky top-24 shadow-[0_4px_24px_rgba(6,71,52,0.06)]">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#c8e6c0] bg-[#f7fff0]">
              <Bell className="w-4 h-4 text-[#064734]" />
              <h3 className="text-sm font-semibold text-[#064734] uppercase tracking-widest">Alerts</h3>
              {alerts && alerts.length > 0 && (
                <span className="ml-auto text-xs bg-[#064734]/10 text-[#064734] border border-[#064734]/20 rounded-full px-2 py-0.5 font-semibold">
                  {alerts.length}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="p-4 max-h-[520px] overflow-y-auto custom-scrollbar space-y-3">
              {alertsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-[#064734]" />
                </div>
              ) : !alerts || alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="w-8 h-8 text-[#4a7c5f] opacity-30 mb-3" />
                  <p className="text-sm text-[#4a7c5f]">No alerts from management.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-[#f7fff0] border border-[#c8e6c0] rounded-xl p-3.5 space-y-1.5 hover:bg-[#f0fce8] transition-colors duration-150"
                  >
                    <p className="text-sm text-[#064734] leading-relaxed">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#4a7c5f] font-medium">{alert.sentByName}</span>
                      <span className="text-[11px] text-[#4a7c5f]/70">
                        {format(new Date(alert.sentAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
