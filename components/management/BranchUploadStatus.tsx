import { BranchName, BRANCHES } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  uploadedBranches: BranchName[];
  missingBranches: BranchName[];
}

export default function BranchUploadStatus({ uploadedBranches, missingBranches }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 mb-8 scrollbar-thin scrollbar-thumb-[#c8e6c0] scrollbar-track-transparent">
      {BRANCHES.map((branch) => {
        const isUploaded = uploadedBranches.includes(branch);

        return (
          <div
            key={branch}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border-2 whitespace-nowrap transition-all duration-200 select-none text-sm font-medium",
              isUploaded
                ? "bg-[#064734] text-white border-[#064734] shadow-sm"
                : "bg-white text-[#4a7c5f] border-[#c8e6c0] hover:border-[#064734]"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                isUploaded ? "bg-[#a8d5b5] animate-pulse" : "bg-[#c8e6c0]"
              )}
            />
            {branch}
            {isUploaded && (
              <span className="text-[#a8d5b5] text-xs ml-1">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
