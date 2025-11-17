"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TimelineChart } from "@/components/dashboard/TimelineChart";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { MetricCard } from "@/components/ui/MetricCard";
import Link from "next/link";

async function fetchProperty(id: string) {
  const response = await fetch(`/api/properties/${id}`);
  if (!response.ok) throw new Error("Failed to fetch property");
  return response.json();
}

async function fetchTimelineData(id: string, filters: any) {
  const params = new URLSearchParams({
    propertyId: id,
    days: filters.days.toString(),
    device: filters.device,
    country: filters.country,
  });
  const response = await fetch(`/api/analytics/timeline?${params}`);
  if (!response.ok) throw new Error("Failed to fetch timeline data");
  return response.json();
}

async function syncProperty(id: string, siteUrl: string) {
  const response = await fetch("/api/gsc/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId: id, siteUrl, days: 90 }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Sync failed");
  }
  return response.json();
}

export default function PropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [filters, setFilters] = useState({
    days: 30,
    device: "all",
    country: "all",
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(propertyId),
  });

  const {
    data: timelineData,
    isLoading: timelineLoading,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ["timeline", propertyId, filters],
    queryFn: () => fetchTimelineData(propertyId, filters),
    enabled: !!property,
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleSync = async () => {
    if (!property?.property) return;

    setIsSyncing(true);
    setSyncError("");

    try {
      await syncProperty(propertyId, property.property.siteUrl);
      await refetchTimeline();
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (propertyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property?.property) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Property not found</h2>
          <p className="mt-2 text-gray-600">The property you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const prop = property.property;
  const stats = property.stats || {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-primary-600">
            Dashboard
          </Link>
          <span>/</span>
          <span>Properties</span>
          <span>/</span>
          <span className="text-gray-900">{prop.displayName || prop.siteUrl}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {prop.displayName || prop.siteUrl}
            </h1>
            <p className="mt-1 text-gray-600">{prop.siteUrl}</p>
            {prop.tags && prop.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {prop.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <ExportButton
              propertyId={propertyId}
              filters={filters}
            />
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isSyncing ? "Syncing..." : "Sync Data"}
            </button>
          </div>
        </div>

        {syncError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{syncError}</p>
          </div>
        )}

        {prop.lastSyncedAt && (
          <p className="mt-2 text-sm text-gray-500">
            Last synced: {new Date(prop.lastSyncedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Clicks"
          value={stats.clicks.toLocaleString()}
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          }
        />
        <MetricCard
          title="Total Impressions"
          value={stats.impressions.toLocaleString()}
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <MetricCard
          title="Average CTR"
          value={`${(stats.ctr * 100).toFixed(2)}%`}
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <MetricCard
          title="Average Position"
          value={stats.position.toFixed(1)}
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Timeline Chart */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Performance Timeline
        </h2>
        <TimelineChart
          data={timelineData?.data || []}
          isLoading={timelineLoading}
        />
      </div>
    </div>
  );
}
