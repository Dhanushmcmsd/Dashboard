"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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
      const res = await fetch(
        `/api/auth/check-email?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (!data.success || !data.data.exists) {
        setError("No account found with this email. Please sign up first.");
        setLoading(false);
        return;
      }

      if (!data.data.isActive) {
        setError("Your account is pending admin approval.");
        setLoading(false);
        return;
      }

      if (!data.data.passwordSet) {
        setError(
          "Password not set. Please check your email for the setup link."
        );
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (
          result.error.toLowerCase().includes("password") ||
          result.error === "CredentialsSignin"
        ) {
          setError("Incorrect password. Please try again.");
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        router.push("/auth/redirect");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0D1117]">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-center items-center w-2/5 bg-[#111827] border-r border-[#1E2D42] px-12">
        <img
          src="/supra-pacific-rights-issue-logo.png"
          alt="Supra Pacific"
          width={88}
          height={88}
          className="object-contain mb-6"
        />
        <h1 className="text-2xl font-bold text-white text-center leading-snug">Supra Pacific</h1>
        <p className="text-sm text-text-muted text-center mt-2 tracking-wide uppercase">
          Management Information System
        </p>
        <div className="mt-10 w-16 h-0.5 bg-[#1E2D42] rounded-full" />
        <p className="mt-6 text-xs text-text-muted text-center max-w-xs">
          Secure portal for branch performance, AUM tracking, and financial analytics.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <img
              src="/supra-pacific-rights-issue-logo.png"
              alt="Supra Pacific"
              width={56}
              height={56}
              className="object-contain mb-3"
            />
            <h1 className="text-xl font-bold text-white">Supra Pacific</h1>
            <p className="text-xs text-text-muted uppercase tracking-wider mt-1">Management Information System</p>
          </div>

          <h2 className="text-xl font-semibold text-white mb-1">Sign in</h2>
          <p className="text-sm text-text-muted mb-8">Enter your credentials to continue.</p>

          {msg === "password-set" && (
            <div className="mb-6 p-4 bg-success/10 border border-success/20 text-success rounded-lg text-sm text-center">
              Password set successfully! You can now log in.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <div className="text-right mt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-xs text-text-muted hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Sign up
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
        <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
