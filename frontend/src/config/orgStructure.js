/**
 * Organization Structure Configuration
 *
 * Defines matrix scope for champion coverage tracking:
 * - Corporate functions: HR, Finance (corp), IT (corp), Legal (corp)
 * - Divisional functions: Marketing, Sales (per-division)
 * - BU-level functions: Engineering teams (per-BU)
 *
 * This configuration is app-specific and used to compute coverage metrics.
 */

/**
 * Functions tracked at corporate level (shared across all divisions)
 */
export const CORPORATE_FUNCTIONS = [
  'HR',
  'Finance',
  'IT',
  'Legal',
  'Operations',
  'Supply Chain'
];

/**
 * Functions tracked at division level (each division has its own)
 */
export const DIVISION_FUNCTIONS = [
  'Marketing',
  'Sales',
  'Product Management'
];

/**
 * Functions tracked at business unit level (each BU has its own)
 */
export const BU_FUNCTIONS = [
  'Engineering - Software',
  'Engineering - Hardware',
  'Engineering - Applications',
  'Service',
  'R&D'
];

/**
 * Matrix scope definition for each function category
 * Determines how champions are assigned and coverage is computed
 */
export const MATRIX_SCOPE = {
  // Corporate functions - single champion covers all of Teradyne
  'HR': { scope: 'corporate', level: 'corporate' },
  'Finance': { scope: 'corporate-plus-divisional', level: 'corporate' },
  'IT': { scope: 'corporate-plus-divisional', level: 'corporate' },
  'Legal': { scope: 'corporate', level: 'corporate' },
  'Operations': { scope: 'corporate', level: 'corporate' },
  'Supply Chain': { scope: 'corporate', level: 'corporate' },

  // Division-level functions - champions per division
  'Marketing': { scope: 'per-division', level: 'division' },
  'Sales': { scope: 'per-division', level: 'division' },
  'Product Management': { scope: 'per-division', level: 'division' },

  // BU-level functions - champions per business unit
  'Engineering - Software': { scope: 'per-bu', level: 'bu' },
  'Engineering - Hardware': { scope: 'per-bu', level: 'bu' },
  'Engineering - Applications': { scope: 'per-bu', level: 'bu' },
  'Service': { scope: 'per-bu', level: 'bu' },
  'R&D': { scope: 'per-bu', level: 'bu' }
};

/**
 * Get required number of champions for a function category
 *
 * @param {string} functionCategory - Function category name
 * @param {Object} orgData - Full org hierarchy data
 * @returns {number} Number of champions needed
 */
export function getRequiredChampions(functionCategory, orgData) {
  const matrixConfig = MATRIX_SCOPE[functionCategory];
  if (!matrixConfig) return 0;

  const { scope } = matrixConfig;

  switch (scope) {
    case 'corporate':
      return 1; // Single champion for entire org

    case 'corporate-plus-divisional':
      // One corporate champion + one per division
      return 1 + (orgData.summary?.divisions?.length || 0);

    case 'per-division':
      // One champion per division
      return orgData.summary?.divisions?.length || 0;

    case 'per-bu':
      // One champion per business unit across all divisions
      return orgData.summary?.divisions?.reduce(
        (total, div) => total + (div.businessUnits?.length || 0),
        0
      ) || 0;

    default:
      return 0;
  }
}

/**
 * Check if a function category should be tracked at a given level
 *
 * @param {string} functionCategory - Function category name
 * @param {string} level - Level to check ('corporate', 'division', 'bu')
 * @returns {boolean} True if function should be tracked at this level
 */
export function isFunctionTrackedAtLevel(functionCategory, level) {
  const matrixConfig = MATRIX_SCOPE[functionCategory];
  if (!matrixConfig) return false;

  const { scope } = matrixConfig;

  if (level === 'corporate') {
    return scope === 'corporate' || scope === 'corporate-plus-divisional';
  }

  if (level === 'division') {
    return scope === 'per-division' || scope === 'corporate-plus-divisional';
  }

  if (level === 'bu') {
    return scope === 'per-bu';
  }

  return false;
}
