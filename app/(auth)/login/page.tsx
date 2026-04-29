"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const successMsg = params.get("msg") === "password-set"
    ? "Password set successfully. You can now log in."
    : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", { email, password, redirect: false });

    if (res?.error) {
      try {
        const check = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const info = await check.json() as { exists: boolean; isActive: boolean; passwordSet: boolean };

        if (!info.exists) {
          setError("No account found with this email.");
        } else if (!info.isActive) {
          setError("Your account is pending admin approval. Please wait.");
        } else if (!info.passwordSet) {
          setError("Please set your password first. Contact your admin for the setup link.");
        } else {
          setError("Invalid email or password.");
        }
      } catch {
        setError("Invalid email or password.");
      }
      setLoading(false);
      return;
    }

    router.push("/auth/redirect");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0A0A0C" }}
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(220,38,38,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white"
              style={{ background: "#DC2626" }}
            >
              BS
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ color: "#E2E8F0" }}>
              BranchSync
            </span>
          </div>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Supra Pacific Financial Services
          </p>
        </div>

        {/* Card */}
        <div
          className="relative overflow-hidden rounded-2xl p-8"
          style={{
            background: "#111116",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(220,38,38,0.08)",
          }}
        >
          {/* Top highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(220,38,38,0.4), transparent)" }}
          />

          {successMsg && (
            <div
              className="mb-5 p-3 rounded-lg text-sm flex items-center gap-2"
              style={{
                background: "rgba(22,163,74,0.1)",
                border: "1px solid rgba(22,163,74,0.25)",
                color: "#4ADE80",
              }}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMsg}
            </div>
          )}

          {error && (
            <div
              className="mb-5 p-3 rounded-lg text-sm"
              style={{
                background: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.25)",
                color: "#F87171",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-widest mb-2"
                style={{ color: "#64748B" }}
              >
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "#0F0F14",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#E2E8F0",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2563EB";
                  e.target.style.boxShadow = "0 0 0 2px rgba(37,99,235,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.boxShadow = "none";
                }}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium uppercase tracking-widest mb-2"
                style={{ color: "#64748B" }}
              >
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "#0F0F14",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#E2E8F0",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2563EB";
                  e.target.style.boxShadow = "0 0 0 2px rgba(37,99,235,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.boxShadow = "none";
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "#2563EB" }}
              onMouseEnter={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "#3B82F6")}
              onMouseLeave={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "#2563EB")}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: "#64748B" }}>
          No account?{" "}
          <Link href="/signup" className="font-medium transition-colors" style={{ color: "#2563EB" }}>
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
