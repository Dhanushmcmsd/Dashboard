"use client";
import { useSession } from "next-auth/react";
import { BRANCHES } from "@/lib/constants";
import type { SessionUser } from "@/types";
import Link from "next/link";

export default function EmployeePage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const branches = user?.branches ?? [];
  return <div><h1 className="text-2xl font-bold mb-4">Select Branch</h1><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{BRANCHES.filter((b) => branches.includes(b)).map((b) => <Link className="bg-surface border border-border rounded p-4" key={b} href={`/employee/upload?branch=${encodeURIComponent(b)}`}>{b}</Link>)}</div></div>;
}
