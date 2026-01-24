/**
 * Organization Data API Client
 *
 * Fetches organizational hierarchy from centralized CDN service.
 * Uses React Query for caching and automatic refetching.
 *
 * CDN Service: org-data-sync-function (Azure Function)
 * Update Frequency: Weekly (Sunday 6 AM UTC)
 * Cache Strategy: 5-minute client cache + 5-minute CDN TTL
 */

import { useQuery } from '@tanstack/react-query';

/**
 * Blob storage endpoint for organizational hierarchy data
 * Public blob storage with CORS enabled
 */
const ORG_DATA_CDN_URL = 'https://orgdatastoragelca.blob.core.windows.net/organizational-data/org-hierarchy.json';

/**
 * Fallback to static file if CDN fetch fails
 * Ensures app continues working during CDN outages
 */
import orgHierarchyFallback from '../data/orgHierarchy.json';

/**
 * React Query hook for fetching organizational hierarchy
 *
 * Features:
 * - 5-minute stale time (prevents excessive refetching)
 * - 10-minute cache time (keeps data in memory)
 * - Automatic fallback to static file on error
 * - No refetch on window focus (data changes weekly, not real-time)
 *
 * @returns {Object} React Query result object
 * @property {Object} data - Organizational hierarchy data
 * @property {boolean} isLoading - True during initial fetch
 * @property {boolean} isError - True if fetch failed
 * @property {Error} error - Error object if fetch failed
 * @property {boolean} isFallback - True if using fallback data
 */
export function useOrgHierarchy() {
  return useQuery({
    queryKey: ['orgHierarchy'],

    queryFn: async () => {
      try {
        const response = await fetch(ORG_DATA_CDN_URL, {
          headers: {
            'Cache-Control': 'max-age=300' // 5-minute client cache
          }
        });

        if (!response.ok) {
          throw new Error(`CDN fetch failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response has expected structure
        if (!data.version || !data.totalEmployees || !data.divisions) {
          throw new Error('Invalid org hierarchy schema');
        }

        return { ...data, isFallback: false };
      } catch (error) {
        console.warn('CDN fetch failed, using fallback data:', error.message);
        return { ...orgHierarchyFallback, isFallback: true };
      }
    },

    // Cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes - data doesn't change frequently
    cacheTime: 10 * 60 * 1000, // 10 minutes - keep in memory

    // Disable automatic refetching (data changes weekly, not real-time)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,

    // Retry configuration
    retry: 2, // Retry twice before falling back
    retryDelay: 1000, // 1 second between retries
  });
}

/**
 * Helper function to check if org data is stale
 * Data is considered stale if version is >7 days old
 *
 * @param {string} version - ISO timestamp from org hierarchy
 * @returns {boolean} True if data is stale
 */
export function isOrgDataStale(version) {
  if (!version) return true;

  const dataDate = new Date(version);
  const now = new Date();
  const daysSinceUpdate = (now - dataDate) / (1000 * 60 * 60 * 24);

  return daysSinceUpdate > 7;
}

/**
 * Helper function to format last update time
 *
 * @param {string} version - ISO timestamp from org hierarchy
 * @returns {string} Human-readable last update time
 */
export function formatLastUpdate(version) {
  if (!version) return 'Unknown';

  const date = new Date(version);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
