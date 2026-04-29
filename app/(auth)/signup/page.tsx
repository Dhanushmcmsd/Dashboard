"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json() as { success: boolean; error?: string };
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Registration failed.");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 text-center shadow-2xl shadow-black/30">
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2">Request submitted</h2>
          <p className="text-text-muted text-sm leading-relaxed mb-2">
            Your account request has been received. An admin will review and approve it.
          </p>
          <p className="text-text-muted text-sm leading-relaxed mb-6">
            Once approved, <span className="text-text-main font-medium">you will receive a setup link</span> to create your password before logging in.
          </p>
          <div className="bg-background border border-border rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Next steps</p>
            <ol className="space-y-1.5 text-sm text-text-muted">
              <li className="flex items-start gap-2"><span className="text-primary font-bold">1.</span> Admin reviews your request</li>
              <li className="flex items-start gap-2"><span className="text-primary font-bold">2.</span> Admin assigns your role and branch</li>
              <li className="flex items-start gap-2"><span className="text-primary font-bold">3.</span> You receive a password setup link</li>
              <li className="flex items-start gap-2"><span className="text-primary font-bold">4.</span> Set password and log in</li>
            </ol>
          </div>
          <Link href="/login" className="text-primary hover:underline text-sm font-medium">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h1 className="text-2xl font-bold text-text-main">Request access</h1>
          <p className="text-text-muted text-sm mt-1">Submit your details for admin approval</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl shadow-black/30">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <div className="mb-5 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-warning text-xs font-medium">No password needed here</p>
            <p className="text-text-muted text-xs mt-0.5">
              You will set your password after admin approval via a secure link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Full name
              </label>
              <input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-text-main text-sm focus:outline-none focus:border-primary transition"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-text-main text-sm focus:outline-none focus:border-primary transition"
                placeholder="you@company.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 mt-2"
            >
              {loading ? "Submitting..." : "Submit request"}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-4">
          Already approved?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
