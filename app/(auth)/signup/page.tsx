"use client";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!data.success) return setError(data.error ?? "Registration failed");
    setSuccess(true);
  }
  if (success) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="bg-surface border border-border rounded-2xl p-8">Registration submitted. <Link href="/login" className="text-primary">Back to login</Link></div></div>;
  return <div className="min-h-screen flex items-center justify-center bg-background px-4"><form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8 space-y-3"><h1 className="text-2xl font-bold">Create account</h1>{error && <div className="text-danger text-sm">{error}</div>}<input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2" placeholder="Name"/><input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2" placeholder="Email"/><input type="password" minLength={8} required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2" placeholder="Password"/><button disabled={loading} className="w-full bg-primary text-white rounded-lg py-2">{loading ? "Submitting..." : "Register"}</button><p className="text-sm text-text-muted">Have an account? <Link href="/login" className="text-primary">Sign in</Link></p></form></div>;
}
