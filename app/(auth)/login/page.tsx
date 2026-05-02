"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const msg = searchParams.get("msg");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="min-h-screen flex" style={{ background: "#080C14" }}>

      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 px-12 py-14"
        style={{
          background: "linear-gradient(160deg, #0D1525 0%, #0A1020 60%, #060A14 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Logo top */}
        <div>
          <img
            src="/logo.svg"
            alt="Supra Pacific"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>

        {/* Center copy */}
        <div>
          <div
            className="inline-block text-xs font-semibold tracking-widest uppercase mb-5 px-3 py-1 rounded-full"
            style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)" }}
          >
            Management Information System
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">Supra Pacific</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
            Centralised branch performance, AUM tracking, and financial analytics — all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {["Branch Performance Analytics", "Gold Loan & AUM Tracking", "Real-time Alerts"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#3B82F6" }} />
                <span className="text-xs" style={{ color: "#475569" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "#1E293B" }}>
          © {new Date().getFullYear()} Supra Pacific. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <img src="/logo.svg" alt="Supra Pacific" width={40} height={40} className="object-contain" />
            <span className="text-base font-semibold text-white">Supra Pacific</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-sm" style={{ color: "#475569" }}>Sign in to your account to continue</p>
          </div>

          {msg === "password-set" && (
            <div
              className="flex items-start gap-3 mb-6 p-4 rounded-xl text-sm"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ADE80" }}
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              Password set successfully. You can now sign in.
            </div>
          )}

          {error && (
            <div
              className="flex items-start gap-3 mb-6 p-4 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#64748B" }}>Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#334155" }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{ background: "#0D1525", border: "1px solid #1E293B" }}
                  onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.target.style.borderColor = "#1E293B")}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: "#64748B" }}>Password</label>
                <Link href="/forgot-password" className="text-xs" style={{ color: "#3B82F6" }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#334155" }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{ background: "#0D1525", border: "1px solid #1E293B" }}
                  onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.target.style.borderColor = "#1E293B")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all mt-2 disabled:opacity-60"
              style={{ background: "#2563EB" }}
              onMouseEnter={(e) => !loading && ((e.target as HTMLElement).style.background = "#1D4ED8")}
              onMouseLeave={(e) => !loading && ((e.target as HTMLElement).style.background = "#2563EB")}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: "#334155" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium" style={{ color: "#3B82F6" }}>Request access</Link>
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
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#080C14" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#3B82F6" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
