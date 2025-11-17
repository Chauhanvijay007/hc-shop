"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

async function fetchGSCProperties() {
  const response = await fetch("/api/gsc/properties");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch GSC properties");
  }
  return response.json();
}

async function addProperty(data: {
  siteUrl: string;
  displayName: string;
  tags: string[];
  brandedKeywords: string[];
}) {
  const response = await fetch("/api/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add property");
  }

  return response.json();
}

export default function ConnectPropertyPage() {
  const router = useRouter();
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [displayName, setDisplayName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [brandedKeywords, setBrandedKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading, error: fetchError } = useQuery({
    queryKey: ["gsc-properties"],
    queryFn: fetchGSCProperties,
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !brandedKeywords.includes(keywordInput.trim())) {
      setBrandedKeywords([...brandedKeywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setBrandedKeywords(brandedKeywords.filter((k) => k !== keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await addProperty({
        siteUrl: selectedProperty,
        displayName: displayName || selectedProperty,
        tags,
        brandedKeywords,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fetchError) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Properties</h3>
            <p className="text-red-700">
              {(fetchError as Error).message}
            </p>
            <p className="mt-2 text-sm text-red-600">
              Please make sure you've granted access to Google Search Console during sign-in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Connect Google Search Console Property
        </h1>
        <p className="text-gray-600 mb-8">
          Select a property from your Google Search Console account to start tracking.
        </p>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading your GSC properties...</p>
          </div>
        )}

        {!isLoading && data?.properties && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Property Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Property *
                </label>
                <select
                  required
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a property...</option>
                  {data.properties.map((prop: any) => (
                    <option key={prop.siteUrl} value={prop.siteUrl}>
                      {prop.siteUrl} ({prop.permissionLevel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., My Main Website"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave blank to use the property URL as the name
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    placeholder="e.g., Client A, E-commerce"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Branded Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branded Keywords (optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                    placeholder="e.g., yourbrand, your brand name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                {brandedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {brandedKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Add keywords to track branded vs non-branded traffic
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedProperty || isSubmitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Adding..." : "Add Property"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
