"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ContentGroup {
  id: string;
  name: string;
  description: string | null;
  color: string;
  conditions: any;
  createdAt: Date;
}

async function fetchProperties() {
  const response = await fetch("/api/properties");
  if (!response.ok) throw new Error("Failed to fetch properties");
  return response.json();
}

async function fetchContentGroups(propertyId: string) {
  const response = await fetch(
    `/api/content-groups?propertyId=${propertyId}`
  );
  if (!response.ok) throw new Error("Failed to fetch content groups");
  return response.json();
}

async function deleteContentGroup(id: string) {
  const response = await fetch(`/api/content-groups/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete content group");
  return response.json();
}

export default function ContentGroupsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<string>("");

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const { data: contentGroupsData, isLoading } = useQuery({
    queryKey: ["content-groups", selectedProperty],
    queryFn: () => fetchContentGroups(selectedProperty),
    enabled: !!selectedProperty,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContentGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-groups"] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Content Groups</h1>
        <p className="mt-2 text-gray-600">
          Organize your URLs into logical groups for better analysis
        </p>
      </div>

      {/* Property Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Property
        </label>
        <div className="flex gap-4">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Choose a property...</option>
            {propertiesData?.properties?.map((prop: any) => (
              <option key={prop.id} value={prop.id}>
                {prop.displayName || prop.siteUrl}
              </option>
            ))}
          </select>
          {selectedProperty && (
            <Link
              href={`/content-groups/create?propertyId=${selectedProperty}`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create New Group
            </Link>
          )}
        </div>
      </div>

      {/* Content Groups List */}
      {selectedProperty && (
        <div>
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading content groups...</p>
            </div>
          )}

          {!isLoading && contentGroupsData?.contentGroups?.length === 0 && (
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No content groups
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first content group.
              </p>
              <div className="mt-6">
                <Link
                  href={`/content-groups/create?propertyId=${selectedProperty}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Create Content Group
                </Link>
              </div>
            </div>
          )}

          {!isLoading && contentGroupsData?.contentGroups?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentGroupsData.contentGroups.map((group: ContentGroup) => (
                <div
                  key={group.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/content-groups/edit/${group.id}`}
                        className="text-gray-400 hover:text-primary-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(group.id, group.name)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {group.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500">
                    {(group.conditions as any).conditions?.length || 0}{" "}
                    condition(s)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
