"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const msg = searchParams.get("msg");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
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
        setError(result.error === "CredentialsSignin" ? "Incorrect password. Please try again." : result.error);
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

  const features = [
    { label: "Branch Performance Analytics", desc: "Real-time metrics across all branches" },
    { label: "Gold Loan & AUM Tracking", desc: "Portfolio monitoring at a glance" },
    { label: "Automated Alerts", desc: "Stay ahead of key thresholds" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#07090F" }}>

      {/* ─── Left brand panel ─── */}
      <div
        className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden"
        style={{
          background: "linear-gradient(175deg, #0C1428 0%, #080E1E 50%, #060A16 100%)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Subtle dot-grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, #1E40AF 0%, #3B82F6 55%, transparent 100%)" }}
        />

        {/* Content */}
        <div className="relative flex flex-col h-full px-12 py-12">

          {/* Top: small brand badge */}
          <div className="flex items-center gap-3 mb-auto">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 40,
                height: 40,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <img
                src="/supra-pacific-rights-issue-logo.jpg"
                alt="Supra Pacific"
                width={26}
                height={26}
                style={{ objectFit: "contain", borderRadius: 3 }}
              />
            </div>
            <div>
              <p className="text-white font-semibold" style={{ fontSize: "0.8125rem" }}>Supra Pacific</p>
              <p style={{ fontSize: "0.625rem", letterSpacing: "0.14em", color: "#3B82F6", textTransform: "uppercase" }}>Management MIS</p>
            </div>
          </div>

          {/* Centre: logo + headline */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <img
              src="/supra-pacific-rights-issue-logo.jpg"
              alt="Supra Pacific Logo"
              width={108}
              height={108}
              className="mb-9"
              style={{ objectFit: "contain" }}
            />

            <h1
              className="font-bold leading-tight mb-4"
              style={{ fontSize: "1.875rem", color: "#F1F5F9", letterSpacing: "-0.025em" }}
            >
              One dashboard.<br />Every insight.
            </h1>
            <p className="text-sm leading-relaxed mb-10" style={{ color: "#475569", maxWidth: "28ch" }}>
              Centralised branch performance and financial analytics — built for Supra Pacific.
            </p>

            {/* Feature list */}
            <div className="space-y-5">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.18)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#3B82F6" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#CBD5E1" }}>{f.label}</p>
                    <p className="mt-0.5" style={{ fontSize: "0.75rem", color: "#334155" }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p style={{ fontSize: "0.6875rem", color: "#1E293B" }}>
            &copy; {new Date().getFullYear()} Supra Pacific. All rights reserved.
          </p>
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <img
              src="/supra-pacific-rights-issue-logo.jpg"
              alt="Supra Pacific"
              width={36}
              height={36}
              style={{ objectFit: "contain", borderRadius: 4 }}
            />
            <div>
              <p className="text-white font-semibold" style={{ fontSize: "0.875rem" }}>Supra Pacific</p>
              <p style={{ fontSize: "0.625rem", letterSpacing: "0.14em", color: "#3B82F6", textTransform: "uppercase" }}>Management MIS</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-9">
            <h2
              className="font-bold text-white mb-2"
              style={{ fontSize: "1.625rem", letterSpacing: "-0.02em" }}
            >
              Sign in
            </h2>
            <p className="text-sm" style={{ color: "#475569" }}>
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Success */}
          {msg === "password-set" && (
            <div
              className="flex items-center gap-3 mb-6 p-4 rounded-xl text-sm"
              style={{
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.14)",
                color: "#4ADE80",
              }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Password set successfully. You can now sign in.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-3 mb-6 p-4 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.14)",
                color: "#F87171",
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                className="block font-medium mb-2"
                style={{ fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-[15px] h-[15px]"
                  style={{ color: "#2D3F5C" }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@suprapacific.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 rounded-xl text-sm text-white placeholder-[#1E2D40] outline-none"
                  style={{
                    background: "#0D1626",
                    border: "1px solid #162035",
                    padding: "14px 16px 14px 44px",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563EB";
                    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#162035";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="font-medium"
                  style={{ fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.03em" }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors hover:underline"
                  style={{ color: "#3B82F6" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-[15px] h-[15px]"
                  style={{ color: "#2D3F5C" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  autoComplete="current-password"
                  className="w-full rounded-xl text-sm text-white placeholder-[#1E2D40] outline-none"
                  style={{
                    background: "#0D1626",
                    border: "1px solid #162035",
                    padding: "14px 48px 14px 44px",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563EB";
                    e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#162035";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: showPassword ? "#3B82F6" : "#2D3F5C" }}
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
              className="w-full flex items-center justify-center gap-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
              style={{
                background: "#2563EB",
                padding: "14px 24px",
                fontSize: "0.875rem",
                transition: "background 0.15s, transform 0.1s, box-shadow 0.15s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(37,99,235,0.25)",
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#1D4ED8"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4), 0 6px 24px rgba(37,99,235,0.35)"; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#2563EB"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(37,99,235,0.25)"; } }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.99)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
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

          <p className="mt-8 text-center" style={{ fontSize: "0.75rem", color: "#1E293B" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium transition-colors hover:underline"
              style={{ color: "#3B82F6" }}
            >
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#07090F" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#3B82F6" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
