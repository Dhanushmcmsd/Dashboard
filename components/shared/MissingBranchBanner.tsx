"use client";

import { BranchName } from "@/types";
import { AlertTriangle } from "lucide-react";

interface Props {
  branches: BranchName[];
}

export default function MissingBranchBanner({ branches }: Props) {
  if (branches.length === 0) return null;

  return (
    <div className="bg-danger/10 border border-danger/20 text-danger-foreground rounded-lg p-4 mb-6 flex items-start space-x-3">
      <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
      <div>
        <h4 className="font-medium text-danger">Missing Uploads</h4>
        <p className="text-sm text-danger/80 mt-1">
          The following branches have not uploaded data for today:
          <span className="font-semibold ml-1">{branches.join(", ")}</span>.
          Their numbers are excluded from the totals below.
        </p>
      </div>
    </div>
  );
}
