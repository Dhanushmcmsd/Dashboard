import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardViewClient from "./DashboardViewClient";
import type { DashboardState, GridPosition, WidgetConfig } from "@/lib/types";

export default async function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const row = await prisma.dashboardLayout.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!row) notFound();
  if (!row.isShared && row.userId !== session.user.id) notFound();

  const isOwner = row.userId === session.user.id;
  const isManagement = ["MANAGEMENT", "ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "");

  const initialState: DashboardState = {
    id: row.id,
    name: row.name,
    layout: row.layout as unknown as GridPosition[],
    widgets: row.widgets as unknown as WidgetConfig[],
    isShared: row.isShared,
    isDirty: false,
  };

  return (
    <DashboardViewClient
      initialState={initialState}
      isOwner={isOwner}
      isManagement={isManagement}
      ownerName={row.user.name}
    />
  );
}
