/**
 * Coverage Computation Utility
 *
 * Computes champion coverage for divisions, business units, and functions
 * based on org hierarchy from CDN and champions data.
 *
 * This is app-specific logic that enhances the shared org data with
 * coverage metrics for the ai-champions-tracker app.
 */

import {
  CORPORATE_FUNCTIONS,
  DIVISION_FUNCTIONS,
  BU_FUNCTIONS,
  isFunctionTrackedAtLevel
} from '../config/orgStructure';

/**
 * Enhance org hierarchy with coverage data from champions
 *
 * @param {Object} orgHierarchy - Org hierarchy from CDN (enhanced structure)
 * @param {Object} championsData - Champions data with assignments
 * @returns {Object} Enhanced org hierarchy with coverage fields
 */
export function enhanceWithCoverage(orgHierarchy, championsData) {
  if (!orgHierarchy.summary?.divisions) {
    return orgHierarchy;
  }

  const champions = championsData.champions || [];
  const confirmedChampions = champions.filter(c => c.status === 'confirmed');

  // Enhance divisions with coverage
  const enhancedDivisions = orgHierarchy.summary.divisions.map(division => {
    // Get champions for this division
    const divisionChampions = confirmedChampions.filter(
      c => c.division === division.name
    );

    // Compute covered headcount (sum of champions' covered employees)
    const covered = divisionChampions.reduce(
      (sum, c) => sum + (c.headcountCovered || 0),
      0
    );

    // Get division-level functions that should be tracked
    const divisionFunctions = DIVISION_FUNCTIONS.map(funcName => {
      // Find champion for this function
      const champion = divisionChampions.find(
        c => c.focusArea === funcName
      );

      // Find function data from org hierarchy
      const funcData = division.functions?.find(
        f => f.category === funcName
      );

      const headcount = funcData?.headcount || 0;
      const covered = champion?.headcountCovered || 0;

      // Compute coverage indicator
      const coverage = covered > 0
        ? (covered >= headcount ? 'full' : 'partial')
        : 'gap';

      return {
        name: funcName,
        headcount,
        covered,
        coverage,
        hasChampion: !!champion
      };
    });

    // Enhance business units
    const enhancedBusinessUnits = (division.businessUnits || []).map(bu => {
      // Get champions for this BU
      const buChampions = divisionChampions.filter(
        c => c.businessUnits && c.businessUnits.includes(bu.id)
      );

      // Compute covered headcount for BU
      const buCovered = buChampions.reduce(
        (sum, c) => sum + (c.headcountCovered || 0),
        0
      );

      // Get BU-level functions that should be tracked
      const buFunctions = BU_FUNCTIONS.map(funcName => {
        // Find champion for this function
        const champion = buChampions.find(
          c => c.focusArea === funcName
        );

        // Find function data from division's functions array
        // (BU functions are tracked within division.functions with same category name)
        const funcData = division.functions?.find(
          f => f.category === funcName
        );

        // For BU-level, we estimate headcount proportionally
        // (actual BU function headcount not broken down in current data)
        const divisionFuncHeadcount = funcData?.headcount || 0;
        const buProportion = bu.headcount / division.headcount;
        const headcount = Math.round(divisionFuncHeadcount * buProportion);

        const covered = champion?.headcountCovered || 0;

        // Compute coverage indicator
        const coverage = covered > 0
          ? (covered >= headcount ? 'full' : 'partial')
          : 'gap';

        return {
          name: funcName,
          headcount,
          covered,
          coverage,
          hasChampion: !!champion
        };
      });

      // Compute coverage indicator for BU
      const buCoverage = buCovered > 0
        ? (buCovered >= bu.headcount ? 'full' : 'partial')
        : 'gap';

      return {
        ...bu,
        covered: buCovered,
        coverage: buCoverage,
        functions: buFunctions
      };
    });

    // Compute coverage indicator for division
    const coverage = covered > 0
      ? (covered >= division.headcount ? 'full' : 'partial')
      : 'gap';

    return {
      ...division,
      covered,
      coverage,
      divisionFunctions,
      businessUnits: enhancedBusinessUnits
    };
  });

  // Enhance corporate functions
  const enhancedCorporate = CORPORATE_FUNCTIONS.map(funcName => {
    // Get corporate champions for this function
    const corpChampions = confirmedChampions.filter(
      c => c.focusArea === funcName
    );

    // Compute covered headcount
    const covered = corpChampions.reduce(
      (sum, c) => sum + (c.headcountCovered || 0),
      0
    );

    // Find corporate function in summary
    const corpFunction = orgHierarchy.summary.corporate?.find(
      cf => cf.category === funcName
    );

    const headcount = corpFunction?.headcount || 0;

    // Compute coverage indicator
    const coverage = covered > 0
      ? (covered >= headcount ? 'full' : 'partial')
      : 'gap';

    return {
      id: funcName.toLowerCase().replace(/\s+/g, '-'),
      name: funcName,
      headcount,
      covered,
      coverage,
      subFunctions: [] // Could be expanded later
    };
  });

  return {
    ...orgHierarchy,
    divisions: enhancedDivisions,
    corporate: enhancedCorporate
  };
}

/**
 * Get champion for a specific function, division, and BU
 *
 * @param {string} functionName - Function name (clean, no indicators)
 * @param {string} divisionName - Division name
 * @param {string} businessUnitId - Business unit ID (or null for division-level)
 * @param {Object} championsData - Champions data
 * @returns {Object|null} Champion object or null if not found
 */
export function getChampionForFunction(functionName, divisionName, businessUnitId, championsData) {
  const champions = championsData.champions || [];

  // Find champion matching function, division, and BU
  return champions.find(c => {
    // Check function match
    if (c.focusArea !== functionName) return false;

    // Check division match
    if (c.division !== divisionName) return false;

    // Check BU match if specified
    if (businessUnitId) {
      return c.businessUnits && c.businessUnits.includes(businessUnitId);
    }

    // Division-level champion (no specific BU)
    return true;
  }) || null;
}
