"use client";

import Link from "next/link";
import { useState } from "react";

interface PropertyCardProps {
  property: {
    id: string;
    siteUrl: string;
    displayName: string | null;
    isFavorite: boolean;
    tags: string[];
    lastSyncedAt: Date | null;
  };
  stats?: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  onFavorite?: (id: string) => void;
  onSync?: (id: string) => void;
}

export function PropertyCard({ property, stats, onFavorite, onSync }: PropertyCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!onSync) return;
    setIsSyncing(true);
    try {
      await onSync(property.id);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/properties/${property.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-primary-600"
            >
              {property.displayName || property.siteUrl}
            </Link>
            {property.isFavorite && (
              <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{property.siteUrl}</p>
          {property.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {property.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onFavorite?.(property.id)}
            className="text-gray-400 hover:text-yellow-400 transition-colors"
            title={property.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="text-gray-400 hover:text-primary-600 transition-colors disabled:opacity-50"
            title="Sync data"
          >
            <svg
              className={`w-5 h-5 ${isSyncing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Clicks</p>
            <p className="text-lg font-semibold text-gray-900">{stats.clicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Impressions</p>
            <p className="text-lg font-semibold text-gray-900">{stats.impressions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">CTR</p>
            <p className="text-lg font-semibold text-gray-900">{(stats.ctr * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg Position</p>
            <p className="text-lg font-semibold text-gray-900">{stats.position.toFixed(1)}</p>
          </div>
        </div>
      )}

      {property.lastSyncedAt && (
        <p className="text-xs text-gray-400 mt-4">
          Last synced: {new Date(property.lastSyncedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
