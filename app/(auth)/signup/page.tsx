"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, Mail, User, ArrowRight, AlertCircle } from "lucide-react";
import Image from "next/image";

// Decorative sparkle (matches login page)
function Sparkle({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor" className={className}
      aria-hidden="true"
    >
      <path d="M12 0 C12 6.627 6.627 12 0 12 C6.627 12 12 17.373 12 24 C12 17.373 17.373 12 24 12 C17.373 12 12 6.627 12 0Z" />
    </svg>
  );
}

export default function SignupPage() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to submit request.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f7fff0]">

      {/* ── Left brand panel (mirrors login) ── */}
      <div className="hidden lg:flex flex-col w-[40%] shrink-0 bg-[#064734] relative overflow-hidden px-14 py-12">

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Sparkle decorations */}
        <div className="absolute top-10 right-10 text-white/20 pointer-events-none flex gap-4">
          <Sparkle size={40} />
          <Sparkle size={24} className="mt-6" />
        </div>
        <div className="absolute bottom-14 left-10 text-white/15 pointer-events-none flex gap-3 items-end">
          <Sparkle size={20} className="mb-2" />
          <Sparkle size={36} />
        </div>

        {/* Brand logo */}
        <div className="relative flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center">
            <Image src="/logo.svg" alt="Supra Pacific" width={26} height={26} style={{ objectFit: "contain" }} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Supra Pacific</p>
            <p className="text-[#E0FFC2] text-[10px] uppercase tracking-widest">Management MIS</p>
          </div>
        </div>

        {/* Centre content */}
        <div className="relative flex-1 flex flex-col justify-center py-10">
          <Image src="/logo.svg" alt="Supra Pacific Logo" width={96} height={96} className="mb-10" style={{ objectFit: "contain" }} />
          <h1 className="text-white font-bold text-3xl leading-tight mb-4" style={{ letterSpacing: "-0.025em" }}>
            Join Supra Pacific<br />Branch Network.
          </h1>
          <p className="text-[#E0FFC2] text-sm leading-relaxed max-w-[26ch]">
            Request access to the centralised branch performance and analytics platform.
          </p>
          <div className="flex flex-col gap-3 mt-10">
            {[
              "Submit your details below",
              "Admin reviews & approves",
              "You receive a password setup link",
            ].map((f, i) => (
              <div key={f} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] text-white/70 font-bold shrink-0">{i + 1}</span>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/25 text-[11px]">
          &copy; {new Date().getFullYear()} Supra Pacific. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <Image src="/logo.svg" alt="Supra Pacific" width={36} height={36} style={{ objectFit: "contain", borderRadius: 4 }} />
            <div>
              <p className="text-[#064734] font-semibold text-sm">Supra Pacific</p>
              <p className="text-[#4a7c5f] text-[10px] uppercase tracking-widest">Management MIS</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-[#c8e6c0] px-8 py-10">

            {success ? (
              /* ── Success state ── */
              <div className="text-center">
                <div className="w-16 h-16 bg-[#f0fce8] border border-[#c8e6c0] rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8 text-[#22c55e]" />
                </div>
                <h2 className="text-2xl font-bold text-[#064734] mb-2" style={{ letterSpacing: "-0.02em" }}>
                  Request Submitted!
                </h2>
                <p className="text-[#4a7c5f] text-sm mb-6">
                  Your access request has been sent to the administrator.
                </p>

                <div className="bg-[#f7fff0] border border-[#c8e6c0] rounded-2xl p-5 text-sm text-[#4a7c5f] text-left mb-6 space-y-2">
                  <p className="font-semibold text-[#064734] mb-3">What happens next?</p>
                  <ol className="space-y-2">
                    {[
                      "Your account is currently pending review.",
                      "An administrator will approve your account.",
                      "They will assign your roles and branches.",
                      "You will receive a Password Setup Link to complete your setup.",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#064734]/10 text-[#064734] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#064734] hover:bg-[#0a5c43] text-white font-semibold py-3.5 rounded-full text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#064734]/25"
                >
                  Back to Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div className="mb-8">
                  <h2 className="text-[#064734] font-bold text-2xl mb-1" style={{ letterSpacing: "-0.02em" }}>
                    Request Access
                  </h2>
                  <p className="text-[#4a7c5f] text-sm">
                    Submit your details — an admin will review and approve.
                  </p>
                </div>

                {/* Error banner */}
                {error && (
                  <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl text-sm bg-red-50 border border-red-200 text-[#991b1b]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Full name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#4a7c5f] uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7c5f]" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        autoComplete="name"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-[#064734] bg-white border border-[#c8e6c0] placeholder:text-[#4a7c5f]/50 outline-none transition-all duration-150 focus:border-[#064734] focus:ring-2 focus:ring-[#064734]/10"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-[#4a7c5f] uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7c5f]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="email"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-[#064734] bg-white border border-[#c8e6c0] placeholder:text-[#4a7c5f]/50 outline-none transition-all duration-150 focus:border-[#064734] focus:ring-2 focus:ring-[#064734]/10"
                      />
                    </div>
                  </div>

                  {/* Info note */}
                  <div className="p-4 bg-[#f7fff0] border border-[#c8e6c0] rounded-2xl text-xs text-[#4a7c5f] leading-relaxed">
                    You don&apos;t need to set a password now. An administrator will send you a
                    setup link after approving your account.
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 bg-[#064734] hover:bg-[#0a5c43] text-white font-semibold py-3.5 rounded-full text-sm transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-[#064734]/25 active:scale-[0.99] mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Request Access</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-[#4a7c5f]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-[#064734] hover:underline transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
