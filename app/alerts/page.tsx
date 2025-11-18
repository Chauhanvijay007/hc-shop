"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await fetch("/api/alerts");
      if (!response.ok) throw new Error("Failed to fetch alerts");
      return response.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/alerts/mark-all-read", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to mark all as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete alert");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[severity] || colors.medium;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      rank_drop: "📉",
      rank_gain: "📈",
      traffic_drop: "⚠️",
      traffic_spike: "🚀",
      ctr_drop: "📊",
      error_spike: "❌",
    };
    return icons[type] || "🔔";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
            <p className="mt-2 text-gray-600">
              Monitor important changes and events across your properties
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/alert-rules"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Manage Rules
            </Link>
            {data?.unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-gray-600">Total Alerts</div>
            <div className="text-2xl font-bold text-gray-900">
              {data?.alerts?.length || 0}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-gray-600">Unread</div>
            <div className="text-2xl font-bold text-blue-600">
              {data?.unreadCount || 0}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-gray-600">High Priority</div>
            <div className="text-2xl font-bold text-red-600">
              {data?.alerts?.filter((a: any) => a.severity === "high" && !a.isRead).length || 0}
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="text-gray-600">Loading alerts...</div>
          </div>
        ) : !data?.alerts || data.alerts.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="text-6xl">🔔</div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No alerts yet</h3>
            <p className="mt-2 text-gray-600">
              Set up alert rules to get notified about important changes
            </p>
            <Link
              href="/alert-rules"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create Alert Rules
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`rounded-lg border-l-4 bg-white p-6 shadow transition-all ${
                  alert.isRead ? "opacity-60" : ""
                } ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.title}
                        </h3>
                        {alert.property && (
                          <p className="text-sm text-gray-600">
                            {alert.property.displayName || alert.property.siteUrl}
                          </p>
                        )}
                      </div>
                      {!alert.isRead && (
                        <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-gray-700">{alert.message}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>{format(new Date(alert.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      <span className="capitalize">
                        {alert.severity} priority
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!alert.isRead && (
                      <button
                        onClick={() => markAsReadMutation.mutate(alert.id)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm("Delete this alert?")) {
                          deleteMutation.mutate(alert.id);
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
