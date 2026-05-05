import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7fff0] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200">
          <span className="text-4xl">🔍</span>
        </div>
        <div>
          <h1 className="text-6xl font-black text-[#064734]">404</h1>
          <h2 className="mt-2 text-xl font-semibold text-[#064734]">Page Not Found</h2>
          <p className="mt-3 text-[#4a7c5f]">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#064734] text-white text-sm font-semibold hover:bg-[#053d2d] transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
