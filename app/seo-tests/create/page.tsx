"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function CreateSeoTestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    propertyId: "",
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    testType: "title_tag",
    testPages: "",
    controlPages: "",
  });

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/seo-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create SEO test");
      }
      return response.json();
    },
    onSuccess: (data) => {
      router.push(`/seo-tests/${data.seoTest.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const testPages = formData.testPages
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p);

    const controlPages = formData.controlPages
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p);

    createMutation.mutate({
      ...formData,
      testPages,
      controlPages,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create SEO Test</h1>
          <p className="mt-2 text-gray-600">
            Set up a test to track the impact of your SEO changes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Property
            </label>
            <select
              required
              value={formData.propertyId}
              onChange={(e) =>
                setFormData({ ...formData, propertyId: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="">Select a property</option>
              {propertiesData?.properties?.map((property: any) => (
                <option key={property.id} value={property.id}>
                  {property.displayName || property.siteUrl}
                </option>
              ))}
            </select>
          </div>

          {/* Test Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Test Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Homepage Title Optimization"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
          </div>

          {/* Test Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Test Type
            </label>
            <select
              required
              value={formData.testType}
              onChange={(e) =>
                setFormData({ ...formData, testType: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="title_tag">Title Tag</option>
              <option value="meta_description">Meta Description</option>
              <option value="content">Content</option>
              <option value="url_structure">URL Structure</option>
              <option value="internal_linking">Internal Linking</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <p className="mt-1 text-sm text-gray-500">
              The date when you made the change
            </p>
          </div>

          {/* Test Pages */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Test Pages (URLs)
            </label>
            <textarea
              required
              value={formData.testPages}
              onChange={(e) =>
                setFormData({ ...formData, testPages: e.target.value })
              }
              placeholder="https://example.com/page1&#10;https://example.com/page2"
              rows={5}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter one URL per line - pages where you made the change
            </p>
          </div>

          {/* Control Pages */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Control Pages (URLs) - Optional
            </label>
            <textarea
              value={formData.controlPages}
              onChange={(e) =>
                setFormData({ ...formData, controlPages: e.target.value })
              }
              placeholder="https://example.com/control1&#10;https://example.com/control2"
              rows={5}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Similar pages that didn't receive the change (for comparison)
            </p>
          </div>

          {/* Error Message */}
          {createMutation.isError && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : "Failed to create SEO test"}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {createMutation.isPending ? "Creating..." : "Create Test"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
