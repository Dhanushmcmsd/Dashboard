"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to sign up");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0A0A0C]">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-surface/80 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">BranchSync</h1>
            <p className="text-text-muted">Create your employee account.</p>
          </div>

          {success ? (
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Registration Complete</h2>
              <div className="bg-elevated border border-border rounded-lg p-5 text-sm text-text-muted text-left mb-6 space-y-3">
                <p><strong>Next Steps:</strong></p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>Your account is currently <span className="text-warning">pending</span>.</li>
                  <li>An administrator will review and approve your account.</li>
                  <li>They will assign your roles and branches.</li>
                  <li>You will receive a <strong>Password Setup Link</strong> from the admin to complete your setup.</li>
                </ol>
              </div>
              <Link
                href="/login"
                className="w-full inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg text-xs text-text-muted">
                  Note: You do not need to set a password yet. An administrator will send you a setup link after approving your account.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Access"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-text-muted">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
