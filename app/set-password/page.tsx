"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Invalid Link</h2>
        <p className="text-text-muted mb-6">This setup link is invalid or missing the token parameter.</p>
        <Link href="/login" className="text-primary hover:underline">Return to login</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to set password");
      } else {
        router.push("/login?msg=password-set");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1.5">New Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1.5">Confirm Password</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Set Password"}
      </button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0A0A0C]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-surface/80 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Complete Setup</h1>
            <p className="text-text-muted">Set a password for your account.</p>
          </div>

          <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
            <SetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
