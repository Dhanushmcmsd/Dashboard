import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C] p-4">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-elevated rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-text-muted" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">404</h2>
        <h3 className="text-lg font-medium text-text-primary mb-4">Page Not Found</h3>
        <p className="text-text-muted mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/login"
          className="inline-block w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-xl transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
