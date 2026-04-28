"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) { setError("Invalid credentials or account not activated"); setLoading(false); return; }
    router.push("/auth/redirect");
  }
  return <div className="min-h-screen flex items-center justify-center bg-background px-4"><div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 shadow-2xl"><h1 className="text-2xl font-bold text-text-main mb-1">Sign in</h1><p className="text-text-muted text-sm mb-6">Branch Dashboard</p>{error && <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">{error}</div>}<form onSubmit={handleSubmit} className="space-y-4"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2" placeholder="you@company.com" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2" placeholder="password" /><button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg">{loading ? "Signing in..." : "Sign in"}</button></form><p className="text-center text-text-muted text-sm mt-4">No account? <Link href="/signup" className="text-primary">Register</Link></p></div></div>;
}
