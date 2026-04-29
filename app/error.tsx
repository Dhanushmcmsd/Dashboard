"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C] p-4">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-danger/20">
          <AlertTriangle className="w-8 h-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong!</h2>
        <p className="text-sm text-text-muted mb-8">
          An unexpected error has occurred. Our team has been notified.
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-surface hover:bg-elevated border border-border text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try again
        </button>
      </div>
    </div>
  );
}
