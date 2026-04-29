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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main">Branch Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-black/30">
          {successMsg && (
            <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg text-success text-sm flex items-center gap-2">
              <span>✓</span>
              {successMsg}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-text-main text-sm focus:outline-none focus:border-primary transition"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-text-main text-sm focus:outline-none focus:border-primary transition"
                placeholder="Minimum 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-4">
          No account?{" "}
          <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition">
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
