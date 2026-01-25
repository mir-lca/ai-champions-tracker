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
 * Azure Front Door CDN endpoint for organizational hierarchy data
 * CDN with 5-minute cache, backed by Azure Blob Storage
 *
 * For local development, use blob storage URL directly (has CORS configured for localhost)
 * For production, use Front Door URL
 */
const ORG_DATA_CDN_URL = import.meta.env.DEV
  ? 'https://orgdatastoragelca.blob.core.windows.net/organizational-data/org-hierarchy.json'
  : 'https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json';

/**
 * React Query hook for fetching organizational hierarchy
 *
 * Features:
 * - 5-minute stale time (prevents excessive refetching)
 * - 10-minute cache time (keeps data in memory)
 * - No refetch on window focus (data changes weekly, not real-time)
 *
 * Data structure (enhanced schema):
 * - employees: Array of employee objects with division/BU/function classifications
 * - summary.divisions: Division hierarchy with BU breakdowns
 * - summary.corporate: Corporate function rollups
 * - summary.functionSummary: Cross-divisional function summary
 *
 * @returns {Object} React Query result object
 * @property {Object} data - Organizational hierarchy data
 * @property {boolean} isLoading - True during initial fetch
 * @property {boolean} isError - True if fetch failed
 * @property {Error} error - Error object if fetch failed
 */
export function useOrgHierarchy() {
  return useQuery({
    queryKey: ['orgHierarchy'],

    queryFn: async () => {
      const response = await fetch(ORG_DATA_CDN_URL, {
        headers: {
          'Cache-Control': 'max-age=300' // 5-minute client cache
        }
      });

      if (!response.ok) {
        throw new Error(`CDN fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response has expected enhanced structure
      if (!data.version || !data.totalEmployees || !data.employees || !data.summary?.divisions) {
        throw new Error('Invalid org hierarchy schema - missing required fields');
      }

      return data;
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

/**
 * Helper function to get employees by division
 *
 * @param {Array} employees - Array of employee objects
 * @param {string} divisionId - Division ID (e.g., 'robotics', 'product-test', 'semiconductor-test', 'corporate')
 * @returns {Array} Employees in the specified division
 */
export function getEmployeesByDivision(employees, divisionId) {
  return employees.filter(emp => emp.divisionId === divisionId);
}

/**
 * Helper function to get employees by business unit
 *
 * @param {Array} employees - Array of employee objects
 * @param {string} businessUnitId - Business unit ID (e.g., 'ur', 'mir', 'defense-aerospace')
 * @returns {Array} Employees in the specified business unit
 */
export function getEmployeesByBusinessUnit(employees, businessUnitId) {
  return employees.filter(emp => emp.businessUnitId === businessUnitId);
}

/**
 * Helper function to get employees by function category
 *
 * @param {Array} employees - Array of employee objects
 * @param {string} functionCategory - Function category (e.g., 'Engineering - Software', 'Sales', 'HR')
 * @returns {Array} Employees in the specified function category
 */
export function getEmployeesByFunction(employees, functionCategory) {
  return employees.filter(emp => emp.functionCategory === functionCategory);
}

/**
 * Helper function to get employees by reporting type
 *
 * @param {Array} employees - Array of employee objects
 * @param {string} reportingType - Reporting type ('corporate' or 'divisional')
 * @returns {Array} Employees with the specified reporting type
 */
export function getEmployeesByReportingType(employees, reportingType) {
  return employees.filter(emp => emp.reportingType === reportingType);
}

/**
 * Helper function to get division summary
 *
 * @param {Object} orgData - Full org hierarchy data object
 * @param {string} divisionId - Division ID
 * @returns {Object|null} Division summary object or null if not found
 */
export function getDivisionSummary(orgData, divisionId) {
  return orgData.summary?.divisions?.find(div => div.id === divisionId) || null;
}

/**
 * Helper function to get business unit summary
 *
 * @param {Object} orgData - Full org hierarchy data object
 * @param {string} divisionId - Division ID
 * @param {string} businessUnitId - Business unit ID
 * @returns {Object|null} Business unit summary object or null if not found
 */
export function getBusinessUnitSummary(orgData, divisionId, businessUnitId) {
  const division = getDivisionSummary(orgData, divisionId);
  return division?.businessUnits?.find(bu => bu.id === businessUnitId) || null;
}
