"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

export default function AlertRulesPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    type: "traffic_drop",
    threshold: 20,
    days: 7,
    notifyEmail: true,
    notifyApp: true,
  });

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ["alert-rules"],
    queryFn: async () => {
      const response = await fetch("/api/alert-rules");
      if (!response.ok) throw new Error("Failed to fetch alert rules");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/alert-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create alert rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
      setShowForm(false);
      setFormData({
        name: "",
        type: "traffic_drop",
        threshold: 20,
        days: 7,
        notifyEmail: true,
        notifyApp: true,
      });
      setSelectedProperty("");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const response = await fetch(`/api/alert-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      if (!response.ok) throw new Error("Failed to update alert rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/alert-rules/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete alert rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      propertyId: selectedProperty || null,
      name: formData.name,
      type: formData.type,
      config: {
        threshold: formData.threshold,
        days: formData.days,
      },
      notifyEmail: formData.notifyEmail,
      notifyApp: formData.notifyApp,
    });
  };

  const ruleTypeLabels: Record<string, string> = {
    rank_drop: "Rank Drop",
    rank_gain: "Rank Improvement",
    traffic_drop: "Traffic Drop",
    traffic_spike: "Traffic Spike",
    ctr_drop: "CTR Drop",
    error_spike: "Error Spike",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alert Rules</h1>
            <p className="mt-2 text-gray-600">
              Configure automatic alerts for important changes
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/alerts"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              View Alerts
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {showForm ? "Cancel" : "Create Rule"}
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Create Alert Rule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Homepage Traffic Monitor"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Property (Optional)
                  </label>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    <option value="">All Properties</option>
                    {propertiesData?.properties?.map((property: any) => (
                      <option key={property.id} value={property.id}>
                        {property.displayName || property.siteUrl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Alert Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  >
                    {Object.entries(ruleTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Threshold (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                    min="1"
                    max="100"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Period (Days)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                    min="1"
                    max="90"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.notifyEmail}
                    onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Email Notifications</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.notifyApp}
                    onChange={(e) => setFormData({ ...formData, notifyApp: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">In-App Notifications</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {createMutation.isPending ? "Creating..." : "Create Rule"}
              </button>
            </form>
          </div>
        )}

        {/* Rules List */}
        {isLoading ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="text-gray-600">Loading rules...</div>
          </div>
        ) : !rulesData?.alertRules || rulesData.alertRules.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <h3 className="text-lg font-medium text-gray-900">No alert rules yet</h3>
            <p className="mt-2 text-gray-600">
              Create your first rule to start monitoring your properties
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rulesData.alertRules.map((rule: any) => (
              <div key={rule.id} className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rule.name}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          rule.isEnabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {rule.isEnabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                    {rule.property && (
                      <p className="mt-1 text-sm text-gray-600">
                        {rule.property.displayName || rule.property.siteUrl}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      <span>{ruleTypeLabels[rule.type]}</span>
                      <span>•</span>
                      <span>Threshold: {rule.config.threshold}%</span>
                      <span>•</span>
                      <span>Period: {rule.config.days} days</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        toggleMutation.mutate({
                          id: rule.id,
                          isEnabled: !rule.isEnabled,
                        })
                      }
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {rule.isEnabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this rule?")) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
