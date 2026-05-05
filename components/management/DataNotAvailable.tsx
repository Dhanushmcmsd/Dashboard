interface DataNotAvailableProps {
  title?: string;
  message?: string;
}

export default function DataNotAvailable({
  title = "Data Not Available",
  message = "No records are available for the selected period.",
}: DataNotAvailableProps) {
  return (
    <div className="rounded-xl border border-dashed border-[#c8e6c0] bg-[#f7fff0] p-4 text-sm">
      <p className="font-semibold text-[#064734]">{title}</p>
      <p className="mt-1 text-[#4a7c5f]">{message}</p>
    </div>
  );
}
