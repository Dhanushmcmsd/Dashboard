import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7fff0] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 border-2 border-red-200">
          <span className="text-4xl">🚫</span>
        </div>
        <div>
          <h1 className="text-6xl font-black text-[#064734]">403</h1>
          <h2 className="mt-2 text-xl font-semibold text-[#064734]">Access Denied</h2>
          <p className="mt-3 text-[#4a7c5f]">
            You don&apos;t have permission to view this page. If you believe this
            is a mistake, contact your administrator.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#064734] text-white text-sm font-semibold hover:bg-[#053d2d] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#c8e6c0] bg-white text-[#064734] text-sm font-semibold hover:bg-[#f0fce8] transition-colors"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}
