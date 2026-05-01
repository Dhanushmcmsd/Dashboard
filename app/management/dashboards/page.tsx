import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, LayoutDashboard, Share2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const rows = await prisma.dashboardLayout.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { isShared: true },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  const isManagement = ["MANAGEMENT", "ADMIN", "SUPER_ADMIN"].includes(session.user.role ?? "");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboards</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {rows.length} dashboard{rows.length !== 1 ? "s" : ""} available
          </p>
        </div>
        {isManagement && (
          <Link
            href="/management/dashboards/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> New Dashboard
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <LayoutDashboard size={48} />
          <p className="text-lg font-medium">No dashboards yet</p>
          {isManagement && (
            <Link href="/management/dashboards/new" className="text-primary underline text-sm">
              Create your first dashboard
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((row) => {
            const isOwner = row.userId === session.user.id;
            const widgetCount = Array.isArray(row.widgets) ? (row.widgets as unknown[]).length : 0;
            return (
              <Link
                key={row.id}
                href={`/management/dashboards/${row.id}`}
                className="block bg-card border rounded-xl p-4 hover:border-primary hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {row.name}
                  </h3>
                  {row.isShared && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <Share2 size={10} /> Shared
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{widgetCount} widget{widgetCount !== 1 ? "s" : ""}</p>
                {!isOwner && (
                  <p className="text-xs text-muted-foreground mt-1">By {row.user.name}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                  <Clock size={11} />
                  Updated {formatDistanceToNow(new Date(row.updatedAt), { addSuffix: true })}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
