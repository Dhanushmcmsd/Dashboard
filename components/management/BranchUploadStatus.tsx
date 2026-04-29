import { BranchName, BRANCHES } from "@/types";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  uploadedBranches: BranchName[];
  missingBranches: BranchName[];
}

export default function BranchUploadStatus({ uploadedBranches, missingBranches }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {BRANCHES.map((branch) => {
        const isUploaded = uploadedBranches.includes(branch);
        
        return (
          <div 
            key={branch}
            className={cn(
              "p-4 rounded-xl border flex flex-col items-center text-center transition-colors",
              isUploaded 
                ? "bg-success/5 border-success/20" 
                : "bg-surface border-border opacity-70"
            )}
          >
            <div className="font-medium text-sm text-text-primary mb-2">
              {branch}
            </div>
            {isUploaded ? (
              <div className="flex items-center text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-1.5" />
                Uploaded
              </div>
            ) : (
              <div className="flex items-center text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 mr-1.5" />
                Pending
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
