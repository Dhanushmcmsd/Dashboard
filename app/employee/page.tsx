"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Building2, ShoppingCart, Coins, TrendingUp, CarFront, UserCircle2 } from "lucide-react";
import { BRANCHES } from "@/types";

const getBranchIcon = (branch: string) => {
  switch (branch) {
    case "Supermarket": return <ShoppingCart className="w-8 h-8" />;
    case "Gold Loan": return <Coins className="w-8 h-8" />;
    case "ML Loan": return <TrendingUp className="w-8 h-8" />;
    case "Vehicle Loan": return <CarFront className="w-8 h-8" />;
    case "Personal Loan": return <UserCircle2 className="w-8 h-8" />;
    default: return <Building2 className="w-8 h-8" />;
  }
};

export default function EmployeeHomePage() {
  const { data: session } = useSession();
  const userBranches = session?.user?.branches || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-text-primary">Select Branch</h2>
        <p className="text-text-muted mt-2 text-lg">Choose a branch to upload today's data.</p>
      </div>

      {userBranches.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-text-primary mb-2">No Branches Assigned</h3>
          <p className="text-text-muted max-w-md mx-auto">
            You currently don't have any branches assigned to your account. Please contact your administrator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BRANCHES.filter(b => userBranches.includes(b)).map((branch) => (
            <Link 
              key={branch}
              href={`/employee/upload?branch=${encodeURIComponent(branch)}`}
              className="group bg-surface border border-border hover:border-primary/50 hover:bg-elevated rounded-2xl p-6 transition-all shadow-sm hover:shadow-primary/5 relative overflow-hidden"
            >
              {/* Card glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 bg-elevated group-hover:bg-primary/10 group-hover:text-primary rounded-xl flex items-center justify-center text-text-muted transition-colors mb-6">
                  {getBranchIcon(branch)}
                </div>
                
                <h3 className="text-xl font-semibold text-text-primary mb-2">{branch}</h3>
                <p className="text-text-muted text-sm flex-1">Upload daily data sheets for {branch} branch operations.</p>
                
                <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                  Proceed to Upload &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
