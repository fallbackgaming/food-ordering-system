import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import {
  getAnalytics,
  type AnalyticsRange,
} from "@/lib/analytics";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ range?: string }>;
};

function parseRange(value: string | undefined): AnalyticsRange {
  const n = Number(value);
  if (n === 7 || n === 30 || n === 90) return n;
  return 30;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const data = await getAnalytics(range);

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent">
          Insights
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-canvas">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-canvas/50">
          Historical revenue, bestsellers, stations, and busy hours.
        </p>
      </div>
      <Suspense fallback={null}>
        <AnalyticsDashboard data={data} />
      </Suspense>
    </div>
  );
}
