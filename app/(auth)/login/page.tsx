"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Mail, Lock, ArrowRight,
  CheckCircle2, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import Image from "next/image";

// ── Decorative sparkle SVG (Ascone-style ✦) ──────────────────────────────────
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const msg = searchParams.get("msg");

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res  = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!data.success || !data.data.exists) {
        setError("No account found with this email.");
        setLoading(false);
        return;
      }
      if (!data.data.isActive) {
        setError("Your account is pending admin approval.");
        setLoading(false);
        return;
      }
      if (!data.data.passwordSet) {
        setError("Password not set. Check your email for the setup link.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", { redirect: false, email, password });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Incorrect password. Please try again."
            : result.error
        );
      } else if (result?.ok) {
        router.push("/auth/redirect");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f7fff0]">

      {/* ════════════════════════════════════════════════════════════
          LEFT PANEL — Forest green brand panel (40%)
      ════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col w-[40%] shrink-0 bg-[#064734] relative overflow-hidden px-14 py-12">

        {/* Subtle dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Decorative sparkle cluster — top-right */}
        <div className="absolute top-10 right-10 text-white/20 pointer-events-none flex gap-4">
          <Sparkle size={40} />
          <Sparkle size={24} className="mt-6" />
        </div>

        {/* Decorative sparkle cluster — bottom-left */}
        <div className="absolute bottom-14 left-10 text-white/15 pointer-events-none flex gap-3 items-end">
          <Sparkle size={20} className="mb-2" />
          <Sparkle size={36} />
        </div>

        {/* Brand logo + name */}
        <div className="relative flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Supra Pacific"
              width={26} height={26}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Supra Pacific</p>
            <p className="text-[#E0FFC2] text-[10px] uppercase tracking-widest">Management MIS</p>
          </div>
        </div>

        {/* Centre content */}
        <div className="relative flex-1 flex flex-col justify-center py-10">
          {/* Large logo */}
          <Image
            src="/logo.svg"
            alt="Supra Pacific Logo"
            width={96} height={96}
            className="mb-10"
            style={{ objectFit: "contain" }}
          />

          {/* Tagline */}
          <h1 className="text-white font-bold text-3xl leading-tight mb-4" style={{ letterSpacing: "-0.025em" }}>
            Change the way<br />you manage your<br />branches.
          </h1>

          {/* Subtitle */}
          <p className="text-[#E0FFC2] text-sm leading-relaxed max-w-[26ch]">
            Centralised branch performance and financial analytics — built for Supra Pacific.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 mt-10">
            {[
              "Branch Performance Analytics",
              "Gold Loan & AUM Tracking",
              "Automated Alerts & Reports",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E0FFC2] shrink-0" />
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-white/25 text-[11px]">
          &copy; {new Date().getFullYear()} Supra Pacific. All rights reserved.
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════
          RIGHT PANEL — Light mint form panel (60%)
      ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <Image
              src="/logo.svg"
              alt="Supra Pacific"
              width={36} height={36}
              style={{ objectFit: "contain", borderRadius: 4 }}
            />
            <div>
              <p className="text-[#064734] font-semibold text-sm">Supra Pacific</p>
              <p className="text-[#4a7c5f] text-[10px] uppercase tracking-widest">Management MIS</p>
            </div>
          </div>

          {/* White card */}
          <div className="bg-white rounded-3xl shadow-xl border border-[#c8e6c0] px-8 py-10">

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-[#064734] font-bold text-2xl mb-1" style={{ letterSpacing: "-0.02em" }}>
                Welcome back
              </h2>
              <p className="text-[#4a7c5f] text-sm">
                Enter your credentials to access the dashboard
              </p>
            </div>

            {/* Success banner */}
            {msg === "password-set" && (
              <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl text-sm bg-[#f0faf4] border border-[#c8e6c0] text-[#064734]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#064734]" />
                <span>Password set successfully. You can now sign in.</span>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl text-sm bg-red-50 border border-red-200 text-[#991b1b]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#4a7c5f] uppercase tracking-wider mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7c5f]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@suprapacific.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-[#064734] bg-white border border-[#c8e6c0] placeholder:text-[#4a7c5f]/50 outline-none transition-all duration-150 focus:border-[#064734] focus:ring-2 focus:ring-[#064734]/12"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#4a7c5f] uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#064734] font-medium hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7c5f]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm text-[#064734] bg-white border border-[#c8e6c0] placeholder:text-[#4a7c5f]/50 outline-none transition-all duration-150 focus:border-[#064734] focus:ring-2 focus:ring-[#064734]/12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a7c5f] hover:text-[#064734] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                    <span>Sign in to dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[#4a7c5f]">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#064734] hover:underline transition-colors"
              >
                Request access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f7fff0]">
          <Loader2 className="w-8 h-8 animate-spin text-[#064734]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
