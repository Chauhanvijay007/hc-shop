"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";

interface SeoTest {
  id: string;
  name: string;
  testType: string;
  startDate: string;
  endDate: string | null;
  status: string;
  property: {
    siteUrl: string;
    displayName: string | null;
  };
  testPages: string[];
  controlPages: string[];
  createdAt: string;
}

export default function SeoTestsPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["seo-tests", selectedProperty, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProperty) params.append("propertyId", selectedProperty);
      if (selectedStatus) params.append("status", selectedStatus);

      const response = await fetch(`/api/seo-tests?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch SEO tests");
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      running: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return badges[status] || badges.running;
  };

  const getTestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      title_tag: "Title Tag",
      meta_description: "Meta Description",
      content: "Content",
      url_structure: "URL Structure",
      internal_linking: "Internal Linking",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SEO Tests & Experiments</h1>
            <p className="mt-2 text-gray-600">
              Track and measure the impact of your SEO changes
            </p>
          </div>
          <Link
            href="/seo-tests/create"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create Test
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            <option value="">All Statuses</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Tests List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading SEO tests...</div>
          </div>
        ) : !data?.seoTests || data.seoTests.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <h3 className="text-lg font-medium text-gray-900">No SEO tests yet</h3>
            <p className="mt-2 text-gray-600">
              Create your first test to track the impact of your SEO changes
            </p>
            <Link
              href="/seo-tests/create"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create Test
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {data.seoTests.map((test: SeoTest) => (
              <Link
                key={test.id}
                href={`/seo-tests/${test.id}`}
                className="block rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {test.name}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                          test.status
                        )}`}
                      >
                        {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {test.property.displayName || test.property.siteUrl}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {getTestTypeLabel(test.testType)}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Started {format(new Date(test.startDate), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Test Pages</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {test.testPages.length} page{test.testPages.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Control Pages</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {test.controlPages.length} page{test.controlPages.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
