import { withCompanyScope } from "@/lib/with-company-scope";
import Link from "next/link";
import DataNotAvailable from "@/components/management/DataNotAvailable";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

type Period = "FTD" | "MTD" | "YTD";

function normalizePeriod(period?: string): Period {
  if (period === "FTD" || period === "YTD" || period === "MTD") return period;
  return "MTD";
}

function SectionShell({
  title,
  lines = 3,
}: {
  title: string;
  lines?: number;
}) {
  return (
    <section className="rounded-2xl border border-[#c8e6c0] bg-white p-5">
      <h2 className="text-lg font-semibold text-[#064734]">{title}</h2>
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={`${title}-${index}`}
            className="h-4 animate-pulse rounded bg-[#e3f5d8]"
            style={{ width: `${90 - index * 12}%` }}
          />
        ))}
      </div>
      <div className="mt-4">
        <DataNotAvailable />
      </div>
    </section>
  );
}

export default async function GoldLoanPage({
  params,
  searchParams,
}: {
  params: Promise<{ companySlug: string }>;
  searchParams?: Promise<{ period?: string }>;
}) {
  const { companySlug } = await params;
  const resolvedSearch = await (searchParams ?? Promise.resolve({}));

  try {
    await withCompanyScope(companySlug);
  } catch (e) {
    if (e instanceof Response) {
      if (e.status === 401 || e.status === 403) {
        redirect("/login");
      }
      notFound();
    }
    throw e;
  }

  const period = normalizePeriod(resolvedSearch?.period);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[#c8e6c0] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#064734]">Gold Loan Dashboard</h1>
            <p className="mt-1 text-sm text-[#4a7c5f]">
              Structured shell for KPI and risk sections.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-xl border border-[#c8e6c0] bg-[#f7fff0] p-1">
            {(["FTD", "MTD", "YTD"] as const).map((item) => {
              const active = item === period;
              return (
                <Link
                  key={item}
                  href={`/${companySlug}/gold-loan?period=${item}`}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[#064734] text-white"
                      : "text-[#4a7c5f] hover:bg-[#e3f5d8] hover:text-[#064734]"
                  }`}
                >
                  {item}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <div
        className="grid gap-4"
        style={{
          gridTemplateAreas: `
            "KpiGrid"
            "DisbursementCollection"
            "BucketAnalysis"
            "NewCustomers"
            "ClosedLoans"
            "HighRisk"
            "NpaRisk"
            "BranchTable"
            "Alerts"
          `,
        }}
      >
        <div className="md:hidden">
          <SectionShell title="KpiGrid" lines={4} />
          <div className="mt-4">
            <SectionShell title="DisbursementCollection" lines={4} />
          </div>
          <div className="mt-4">
            <SectionShell title="BucketAnalysis" lines={4} />
          </div>
          <div className="mt-4">
            <SectionShell title="NewCustomers" lines={3} />
          </div>
          <div className="mt-4">
            <SectionShell title="ClosedLoans" lines={3} />
          </div>
          <div className="mt-4">
            <SectionShell title="HighRisk" lines={5} />
          </div>
          <div className="mt-4">
            <SectionShell title="NpaRisk" lines={3} />
          </div>
          <div className="mt-4">
            <SectionShell title="BranchTable" lines={5} />
          </div>
          <div className="mt-4">
            <SectionShell title="Alerts" lines={4} />
          </div>
        </div>

        <div
          className="hidden md:grid md:gap-4"
          style={{
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            gridTemplateAreas: `
              "KpiGrid KpiGrid KpiGrid KpiGrid KpiGrid KpiGrid KpiGrid KpiGrid KpiGrid KpiGrid KpiGrid KpiGrid"
              "DisbursementCollection DisbursementCollection DisbursementCollection DisbursementCollection DisbursementCollection DisbursementCollection DisbursementCollection BucketAnalysis BucketAnalysis BucketAnalysis BucketAnalysis BucketAnalysis"
              "NewCustomers NewCustomers NewCustomers NewCustomers ClosedLoans ClosedLoans ClosedLoans ClosedLoans NpaRisk NpaRisk NpaRisk NpaRisk"
              "HighRisk HighRisk HighRisk HighRisk HighRisk HighRisk HighRisk HighRisk HighRisk HighRisk HighRisk HighRisk"
              "BranchTable BranchTable BranchTable BranchTable BranchTable BranchTable BranchTable BranchTable BranchTable BranchTable BranchTable BranchTable"
              "Alerts Alerts Alerts Alerts Alerts Alerts Alerts Alerts Alerts Alerts Alerts Alerts"
            `,
          }}
        >
          <div style={{ gridArea: "KpiGrid" }}>
            <SectionShell title="KpiGrid" lines={4} />
          </div>
          <div style={{ gridArea: "DisbursementCollection" }}>
            <SectionShell title="DisbursementCollection" lines={4} />
          </div>
          <div style={{ gridArea: "BucketAnalysis" }}>
            <SectionShell title="BucketAnalysis" lines={4} />
          </div>
          <div style={{ gridArea: "NewCustomers" }}>
            <SectionShell title="NewCustomers" lines={3} />
          </div>
          <div style={{ gridArea: "ClosedLoans" }}>
            <SectionShell title="ClosedLoans" lines={3} />
          </div>
          <div style={{ gridArea: "NpaRisk" }}>
            <SectionShell title="NpaRisk" lines={3} />
          </div>
          <div style={{ gridArea: "HighRisk" }}>
            <SectionShell title="HighRisk" lines={5} />
          </div>
          <div style={{ gridArea: "BranchTable" }}>
            <SectionShell title="BranchTable" lines={5} />
          </div>
          <div style={{ gridArea: "Alerts" }}>
            <SectionShell title="Alerts" lines={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
