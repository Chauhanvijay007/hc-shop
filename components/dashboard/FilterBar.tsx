"use client";

import { useState } from "react";

interface DateRange {
  label: string;
  days: number;
}

const dateRanges: DateRange[] = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
];

const devices = [
  { label: "All Devices", value: "all" },
  { label: "Desktop", value: "desktop" },
  { label: "Mobile", value: "mobile" },
  { label: "Tablet", value: "tablet" },
];

interface FilterBarProps {
  onFilterChange: (filters: {
    days: number;
    device: string;
    country: string;
  }) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");

  const handleDaysChange = (days: number) => {
    setSelectedDays(days);
    onFilterChange({ days, device: selectedDevice, country: selectedCountry });
  };

  const handleDeviceChange = (device: string) => {
    setSelectedDevice(device);
    onFilterChange({ days: selectedDays, device, country: selectedCountry });
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    onFilterChange({ days: selectedDays, device: selectedDevice, country });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {dateRanges.map((range) => (
              <button
                key={range.days}
                onClick={() => handleDaysChange(range.days)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedDays === range.days
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Device Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Device
          </label>
          <select
            value={selectedDevice}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {devices.map((device) => (
              <option key={device.value} value={device.value}>
                {device.label}
              </option>
            ))}
          </select>
        </div>

        {/* Country Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Countries</option>
            <option value="usa">United States</option>
            <option value="gbr">United Kingdom</option>
            <option value="can">Canada</option>
            <option value="aus">Australia</option>
            <option value="ind">India</option>
            {/* Add more countries as needed */}
          </select>
        </div>
      </div>
    </div>
  );
}
