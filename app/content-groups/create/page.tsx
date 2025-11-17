"use client";


import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

interface Condition {
  field: "url" | "page";
  operator: "contains" | "startsWith" | "endsWith" | "equals" | "regex";
  value: string;
  caseSensitive: boolean;
}

const operators = [
  { value: "contains", label: "Contains" },
  { value: "startsWith", label: "Starts with" },
  { value: "endsWith", label: "Ends with" },
  { value: "equals", label: "Equals" },
  { value: "regex", label: "Regex" },
];

const colors = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#6366f1", // indigo
  "#14b8a6", // teal
];

async function createContentGroup(data: any) {
  const response = await fetch("/api/content-groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create content group");
  }
  return response.json();
}

export default function CreateContentGroupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<Condition[]>([
    {
      field: "url",
      operator: "contains",
      value: "",
      caseSensitive: false,
    },
  ]);
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const createMutation = useMutation({
    mutationFn: createContentGroup,
    onSuccess: () => {
      router.push("/content-groups");
    },
  });

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        field: "url",
        operator: "contains",
        value: "",
        caseSensitive: false,
      },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    setConditions(
      conditions.map((cond, i) =>
        i === index ? { ...cond, ...updates } : cond
      )
    );
  };

  const testPattern = () => {
    if (!testUrl) return;

    // Simple test logic (matches the matcher)
    const result = logic === "AND"
      ? conditions.every((cond) => matchCondition(testUrl, cond))
      : conditions.some((cond) => matchCondition(testUrl, cond));

    setTestResult(result);
  };

  const matchCondition = (url: string, cond: Condition): boolean => {
    const urlToCheck = cond.caseSensitive ? url : url.toLowerCase();
    const valueToCheck = cond.caseSensitive
      ? cond.value
      : cond.value.toLowerCase();

    switch (cond.operator) {
      case "contains":
        return urlToCheck.includes(valueToCheck);
      case "startsWith":
        return urlToCheck.startsWith(valueToCheck);
      case "endsWith":
        return urlToCheck.endsWith(valueToCheck);
      case "equals":
        return urlToCheck === valueToCheck;
      case "regex":
        try {
          const flags = cond.caseSensitive ? "" : "i";
          return new RegExp(valueToCheck, flags).test(url);
        } catch {
          return false;
        }
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!propertyId) {
      alert("No property selected");
      return;
    }

    if (!name || conditions.some((c) => !c.value)) {
      alert("Please fill in all required fields");
      return;
    }

    await createMutation.mutateAsync({
      propertyId,
      name,
      description,
      color,
      conditions: {
        conditions,
        logic,
      },
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/content-groups" className="hover:text-primary-600">
              Content Groups
            </Link>
            <span>/</span>
            <span className="text-gray-900">Create New</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Content Group
          </h1>
          <p className="mt-2 text-gray-600">
            Define rules to automatically categorize your URLs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Blog Posts, Product Pages"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full ${
                        color === c ? "ring-2 ring-offset-2 ring-gray-400" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* URL Matching Rules */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                URL Matching Rules
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLogic("AND")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    logic === "AND"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Match ALL
                </button>
                <button
                  type="button"
                  onClick={() => setLogic("OR")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    logic === "OR"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Match ANY
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    <select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition(index, {
                          operator: e.target.value as any,
                        })
                      }
                      className="col-span-3 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(index, { value: e.target.value })
                      }
                      placeholder={
                        condition.operator === "regex"
                          ? "^/blog/.*"
                          : "/blog/"
                      }
                      className="col-span-7 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      required
                    />

                    <label className="col-span-2 flex items-center text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={condition.caseSensitive}
                        onChange={(e) =>
                          updateCondition(index, {
                            caseSensitive: e.target.checked,
                          })
                        }
                        className="mr-1"
                      />
                      Case sensitive
                    </label>
                  </div>

                  {conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="text-red-600 hover:text-red-700"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addCondition}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Condition
            </button>
          </div>

          {/* Test Pattern */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Test Pattern
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => {
                  setTestUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://example.com/blog/post-title"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={testPattern}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Test
              </button>
            </div>
            {testResult !== null && (
              <div
                className={`mt-3 p-3 rounded-md ${
                  testResult ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                {testResult ? "✓ URL matches this group" : "✗ URL does not match this group"}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link
              href="/content-groups"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Content Group"}
            </button>
          </div>

          {createMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                {(createMutation.error as Error).message}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
