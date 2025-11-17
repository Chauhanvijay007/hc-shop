"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { MetricCard } from "@/components/ui/MetricCard";
import Link from "next/link";

async function fetchProperties() {
  const response = await fetch("/api/properties");
  if (!response.ok) throw new Error("Failed to fetch properties");
  return response.json();
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const handleFavorite = async (id: string) => {
    // TODO: Implement favorite toggle
    console.log("Toggle favorite:", id);
  };

  const handleSync = async (id: string) => {
    // TODO: Implement sync
    console.log("Sync property:", id);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || "User"}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your Google Search Console properties
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Properties"
          value={data?.properties?.length || 0}
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <MetricCard
          title="Total Clicks"
          value="0"
          change={0}
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          }
        />
        <MetricCard
          title="Total Impressions"
          value="0"
          change={0}
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
          title="Avg Position"
          value="0.0"
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

      {/* Properties Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Properties</h2>
          <Link
            href="/properties/connect"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Connect New Property
          </Link>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading properties. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && data?.properties?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by connecting your first Google Search Console property.
            </p>
            <div className="mt-6">
              <Link
                href="/properties/connect"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Connect Property
              </Link>
            </div>
          </div>
        )}

        {!isLoading && !error && data?.properties?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.properties.map((property: any) => (
              <PropertyCard
                key={property.id}
                property={property}
                onFavorite={handleFavorite}
                onSync={handleSync}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
