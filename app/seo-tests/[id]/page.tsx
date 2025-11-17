"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";

export default function SeoTestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading } = useQuery({
    queryKey: ["seo-test", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/seo-tests/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch SEO test");
      return response.json();
    },
    refetchInterval: (query) => {
      const test = query.state.data?.seoTest;
      return test?.status === "running" ? 30000 : false; // Refetch every 30s if running
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/seo-tests/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", endDate }),
      });
      if (!response.ok) throw new Error("Failed to complete test");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-test", params.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/seo-tests/${params.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete test");
      return response.json();
    },
    onSuccess: () => {
      router.push("/seo-tests");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading test...</div>
      </div>
    );
  }

  const test = data?.seoTest;
  if (!test) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Test not found</div>
      </div>
    );
  }

  const baseline = test.metrics?.baseline;
  const current = test.results?.current || test.results?.final;
  const daysRunning = differenceInDays(
    test.endDate ? new Date(test.endDate) : new Date(),
    new Date(test.startDate)
  );

  const calculateChange = (currentValue: number, baselineValue: number) => {
    if (!baselineValue) return 0;
    return ((currentValue - baselineValue) / baselineValue) * 100;
  };

  const aggregateMetrics = (pages: any[]) => {
    if (!pages || pages.length === 0) return null;

    const total = pages.reduce(
      (acc, page) => ({
        clicks: acc.clicks + (page._sum?.clicks || 0),
        impressions: acc.impressions + (page._sum?.impressions || 0),
        ctr: acc.ctr + (page._avg?.ctr || 0),
        position: acc.position + (page._avg?.position || 0),
        count: acc.count + 1,
      }),
      { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }
    );

    return {
      clicks: total.clicks,
      impressions: total.impressions,
      ctr: total.count > 0 ? total.ctr / total.count : 0,
      position: total.count > 0 ? total.position / total.count : 0,
    };
  };

  const baselineTest = aggregateMetrics(baseline?.testPages);
  const currentTest = aggregateMetrics(current?.testPages);
  const baselineControl = aggregateMetrics(baseline?.controlPages);
  const currentControl = aggregateMetrics(current?.controlPages);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{test.name}</h1>
              <p className="mt-2 text-gray-600">
                {test.property.displayName || test.property.siteUrl}
              </p>
            </div>
            <div className="flex gap-3">
              {test.status === "running" && (
                <button
                  onClick={() => {
                    if (confirm("Complete this test?")) {
                      completeMutation.mutate();
                    }
                  }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Complete Test
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm("Delete this test?")) {
                    deleteMutation.mutate();
                  }
                }}
                className="rounded-lg border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Test Info */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-gray-600">Status</div>
              <div className="mt-1 text-lg font-semibold capitalize">{test.status}</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-gray-600">Test Type</div>
              <div className="mt-1 text-lg font-semibold">{test.testType.replace(/_/g, " ")}</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-gray-600">Start Date</div>
              <div className="mt-1 text-lg font-semibold">
                {format(new Date(test.startDate), "MMM d, yyyy")}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-gray-600">Duration</div>
              <div className="mt-1 text-lg font-semibold">{daysRunning} days</div>
            </div>
          </div>
        </div>

        {/* End Date Selector (for running tests) */}
        {test.status === "running" && (
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <label className="block text-sm font-medium text-gray-700">
              End Date (to complete test)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="mt-2 rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>
        )}

        {/* Results Comparison */}
        {currentTest && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Test Pages Results */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-gray-900">Test Pages</h2>
              <p className="text-sm text-gray-600">{test.testPages.length} pages</p>

              <div className="mt-6 space-y-4">
                <MetricCard
                  label="Clicks"
                  baseline={baselineTest?.clicks || 0}
                  current={currentTest?.clicks || 0}
                />
                <MetricCard
                  label="Impressions"
                  baseline={baselineTest?.impressions || 0}
                  current={currentTest?.impressions || 0}
                />
                <MetricCard
                  label="CTR"
                  baseline={(baselineTest?.ctr || 0) * 100}
                  current={(currentTest?.ctr || 0) * 100}
                  isPercentage
                />
                <MetricCard
                  label="Position"
                  baseline={baselineTest?.position || 0}
                  current={currentTest?.position || 0}
                  isPosition
                />
              </div>
            </div>

            {/* Control Pages Results */}
            {test.controlPages.length > 0 && currentControl && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-semibold text-gray-900">Control Pages</h2>
                <p className="text-sm text-gray-600">{test.controlPages.length} pages</p>

                <div className="mt-6 space-y-4">
                  <MetricCard
                    label="Clicks"
                    baseline={baselineControl?.clicks || 0}
                    current={currentControl?.clicks || 0}
                  />
                  <MetricCard
                    label="Impressions"
                    baseline={baselineControl?.impressions || 0}
                    current={currentControl?.impressions || 0}
                  />
                  <MetricCard
                    label="CTR"
                    baseline={(baselineControl?.ctr || 0) * 100}
                    current={(currentControl?.ctr || 0) * 100}
                    isPercentage
                  />
                  <MetricCard
                    label="Position"
                    baseline={baselineControl?.position || 0}
                    current={currentControl?.position || 0}
                    isPosition
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pages List */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="font-semibold text-gray-900">Test Pages</h3>
            <ul className="mt-4 space-y-2">
              {test.testPages.map((page: string, idx: number) => (
                <li key={idx} className="truncate text-sm text-gray-600">
                  {page}
                </li>
              ))}
            </ul>
          </div>

          {test.controlPages.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="font-semibold text-gray-900">Control Pages</h3>
              <ul className="mt-4 space-y-2">
                {test.controlPages.map((page: string, idx: number) => (
                  <li key={idx} className="truncate text-sm text-gray-600">
                    {page}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  baseline,
  current,
  isPercentage = false,
  isPosition = false,
}: {
  label: string;
  baseline: number;
  current: number;
  isPercentage?: boolean;
  isPosition?: boolean;
}) {
  const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
  const isPositive = isPosition ? change < 0 : change > 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-600";

  const formatValue = (val: number) => {
    if (isPercentage) return `${val.toFixed(2)}%`;
    if (isPosition) return val.toFixed(1);
    return Math.round(val).toLocaleString();
  };

  return (
    <div className="border-l-4 border-blue-500 bg-gray-50 p-4">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="mt-2 flex items-baseline justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{formatValue(current)}</div>
          <div className="text-sm text-gray-600">
            Baseline: {formatValue(baseline)}
          </div>
        </div>
        {baseline > 0 && (
          <div className={`text-lg font-semibold ${changeColor}`}>
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}
