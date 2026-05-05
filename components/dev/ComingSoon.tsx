/**
 * ComingSoon — placeholder card for portfolio routes not yet implemented.
 */
export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#c8e6c0] bg-white p-12 text-center">
      <p className="text-5xl mb-4">🚧</p>
      <h2 className="text-xl font-bold text-[#064734]">{title}</h2>
      <p className="mt-2 text-[#4a7c5f] text-sm">
        This portfolio dashboard is coming soon. Check back in a future release.
      </p>
    </div>
  );
}
