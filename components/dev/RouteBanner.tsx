/**
 * RouteBanner — visible debug banner rendered on every shell page.
 * Shows the current route path and the required role.
 * Only renders in development unless NEXT_PUBLIC_SHOW_ROUTE_BANNER=true.
 */
export function RouteBanner({
  route,
  role,
}: {
  route: string;
  role: string;
}) {
  const show =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_SHOW_ROUTE_BANNER === "true";

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 font-mono text-xs">
      <span className="shrink-0 font-bold text-amber-700 uppercase tracking-wider">DEV</span>
      <span className="text-amber-800">
        Route: <strong>{route}</strong>
      </span>
      <span className="ml-auto shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-amber-900 font-semibold">
        Role: {role}
      </span>
    </div>
  );
}
