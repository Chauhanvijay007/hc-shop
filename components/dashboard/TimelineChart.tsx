"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface TimelineChartProps {
  data: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  isLoading?: boolean;
}

type MetricType = "clicks" | "impressions" | "ctr" | "position";

const metricConfig = {
  clicks: {
    label: "Clicks",
    color: "#3b82f6",
    yAxisId: "left",
  },
  impressions: {
    label: "Impressions",
    color: "#8b5cf6",
    yAxisId: "left",
  },
  ctr: {
    label: "CTR (%)",
    color: "#10b981",
    yAxisId: "right",
  },
  position: {
    label: "Position",
    color: "#f59e0b",
    yAxisId: "right",
    reversed: true,
  },
};

export function TimelineChart({ data, isLoading }: TimelineChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>([
    "clicks",
    "impressions",
  ]);

  const toggleMetric = (metric: MetricType) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const formatYAxis = (value: number, metric: MetricType) => {
    if (metric === "ctr") {
      return `${value.toFixed(1)}%`;
    }
    if (metric === "position") {
      return value.toFixed(1);
    }
    return value.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="font-semibold text-gray-900 mb-2">
          {format(new Date(label), "MMM dd, yyyy")}
        </p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-semibold text-gray-900">
              {entry.dataKey === "ctr"
                ? `${entry.value.toFixed(2)}%`
                : entry.dataKey === "position"
                ? entry.value.toFixed(1)
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Sync your property data to see the timeline chart.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Toggle Buttons */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(metricConfig) as MetricType[]).map((metric) => {
          const config = metricConfig[metric];
          const isSelected = selectedMetrics.includes(metric);
          return (
            <button
              key={metric}
              onClick={() => toggleMetric(metric)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? "text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={
                isSelected
                  ? { backgroundColor: config.color }
                  : undefined
              }
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), "MMM dd")}
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          {(selectedMetrics.includes("ctr") || selectedMetrics.includes("position")) && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
              reversed={selectedMetrics.includes("position")}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
          />
          {selectedMetrics.includes("clicks") && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="clicks"
              stroke={metricConfig.clicks.color}
              strokeWidth={2}
              dot={false}
              name={metricConfig.clicks.label}
            />
          )}
          {selectedMetrics.includes("impressions") && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="impressions"
              stroke={metricConfig.impressions.color}
              strokeWidth={2}
              dot={false}
              name={metricConfig.impressions.label}
            />
          )}
          {selectedMetrics.includes("ctr") && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ctr"
              stroke={metricConfig.ctr.color}
              strokeWidth={2}
              dot={false}
              name={metricConfig.ctr.label}
            />
          )}
          {selectedMetrics.includes("position") && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="position"
              stroke={metricConfig.position.color}
              strokeWidth={2}
              dot={false}
              name={metricConfig.position.label}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
