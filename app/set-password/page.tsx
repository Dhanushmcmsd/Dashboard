"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="bg-surface border border-danger/30 rounded-2xl p-8 max-w-sm text-center">
          <span className="text-4xl mb-3 block">×</span>
          <h2 className="text-xl font-bold text-text-main mb-2">Invalid link</h2>
          <p className="text-text-muted text-sm mb-4">This link is missing a token. Please ask your admin for a new setup link.</p>
          <Link href="/login" className="text-primary hover:underline text-sm">Back to login</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json() as { success: boolean; error?: string };
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Failed to set password. The link may have expired.");
      return;
    }
    router.push("/login?msg=password-set");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success/10 border border-success/30 mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main">Create your password</h1>
          <p className="text-text-muted text-sm mt-1">Your account has been approved. Set a password to get started.</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-black/30">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-text-main text-sm focus:outline-none focus:border-primary transition"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-text-main text-sm focus:outline-none focus:border-primary transition"
                placeholder="Repeat password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-success hover:bg-success/90 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
            >
              {loading ? "Setting password..." : "Set password and continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
