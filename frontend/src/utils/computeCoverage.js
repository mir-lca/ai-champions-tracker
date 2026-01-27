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

    // Compute covered headcount (calculated dynamically from assigned functions)
    // This will be calculated after we process division functions below
    let covered = 0;

    // Get division-level functions that should be tracked
    let divisionFunctions = DIVISION_FUNCTIONS.map(funcName => {
      // Find champion for this function
      const champion = divisionChampions.find(
        c => c.focusArea === funcName
      );

      // Find function data from org hierarchy
      const funcData = division.functions?.find(
        f => f.category === funcName
      );

      let headcount = funcData?.headcount || 0;

      // Special handling for corporate-plus-divisional functions (like IT)
      // If not in division.functions, estimate from corporate function proportionally
      if (headcount === 0 && funcName === 'IT') {
        const corporateIT = orgHierarchy.summary?.corporate?.find(
          cf => cf.category === 'IT'
        );
        if (corporateIT) {
          const divisionProportion = division.headcount / orgHierarchy.totalEmployees;
          headcount = Math.round(corporateIT.headcount * divisionProportion);
        }
      }

      // Champion covers 100% of function headcount if assigned
      const funcCovered = champion ? headcount : 0;

      // Compute coverage indicator
      const coverage = funcCovered > 0
        ? (funcCovered >= headcount ? 'full' : 'partial')
        : 'gap';

      return {
        name: funcName,
        headcount,
        covered: funcCovered,
        coverage,
        hasChampion: !!champion
      };
    });

    // For Robotics division: add BU-level functions at division level (consolidated view)
    // Since we're hiding BUs for Robotics, show BU functions at division level
    if (division.name === 'Robotics') {
      const buFunctionsForRobotics = BU_FUNCTIONS.map(funcName => {
        // Find all champions for this function in Robotics (across all BUs)
        const champions = divisionChampions.filter(
          c => c.focusArea === funcName
        );

        // Find function data from org hierarchy
        const funcData = division.functions?.find(
          f => f.category === funcName
        );

        const headcount = funcData?.headcount || 0;
        // Champions cover 100% of function headcount if assigned
        const funcCovered = champions.length > 0 ? headcount : 0;

        // Compute coverage indicator
        const coverage = funcCovered > 0
          ? (funcCovered >= headcount ? 'full' : 'partial')
          : 'gap';

        return {
          name: funcName,
          headcount,
          covered: funcCovered,
          coverage,
          hasChampion: champions.length > 0
        };
      });

      // Add BU functions to division functions for Robotics
      divisionFunctions = [...divisionFunctions, ...buFunctionsForRobotics];
    }

    // Calculate total division coverage from all division functions
    covered = divisionFunctions.reduce((sum, func) => sum + func.covered, 0);

    // Enhance business units
    const enhancedBusinessUnits = (division.businessUnits || []).map(bu => {
      // Get champions for this BU
      const buChampions = divisionChampions.filter(
        c => c.businessUnits && c.businessUnits.includes(bu.id)
      );

      // Compute covered headcount for BU (calculated dynamically from BU functions)
      // This will be calculated after processing BU functions below
      let buCovered = 0;

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

        // Champion covers 100% of function headcount if assigned
        const funcCovered = champion ? headcount : 0;

        // Compute coverage indicator
        const coverage = funcCovered > 0
          ? (funcCovered >= headcount ? 'full' : 'partial')
          : 'gap';

        return {
          name: funcName,
          headcount,
          covered: funcCovered,
          coverage,
          hasChampion: !!champion
        };
      });

      // Calculate BU covered from all BU functions
      buCovered = buFunctions.reduce((sum, func) => sum + func.covered, 0);

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
    // Get corporate champions for this function (division must be 'Corporate')
    const corpChampions = confirmedChampions.filter(
      c => c.focusArea === funcName && c.division === 'Corporate'
    );

    // Find corporate function in summary
    const corpFunction = orgHierarchy.summary.corporate?.find(
      cf => cf.category === funcName
    );

    const headcount = corpFunction?.headcount || 0;

    // Champion covers 100% of function headcount if assigned
    const covered = corpChampions.length > 0 ? headcount : 0;

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

/**
 * Get headcount covered by a champion (dynamically calculated from org hierarchy)
 *
 * @param {Object} champion - Champion object with division, focusArea, businessUnits
 * @param {Object} enhancedOrgHierarchy - Enhanced org hierarchy with coverage data
 * @returns {number} Headcount covered (100% of assigned function's headcount)
 */
export function getChampionHeadcount(champion, enhancedOrgHierarchy) {
  if (!champion || !enhancedOrgHierarchy.divisions) {
    return 0;
  }

  // Find the division
  const division = enhancedOrgHierarchy.divisions.find(d => d.name === champion.division);
  if (!division) {
    // Check if it's a corporate champion
    if (champion.division === 'Corporate' && enhancedOrgHierarchy.corporate) {
      const corpFunc = enhancedOrgHierarchy.corporate.find(cf => cf.name === champion.focusArea);
      return corpFunc?.headcount || 0;
    }
    return 0;
  }

  // Check if it's a BU-level or division-level champion
  if (champion.businessUnits && champion.businessUnits.length > 0) {
    // BU-level champion - find the BU function
    const bu = division.businessUnits?.find(b => champion.businessUnits.includes(b.id));
    if (!bu) return 0;

    const buFunc = bu.functions?.find(f => f.name === champion.focusArea);
    return buFunc?.headcount || 0;
  } else {
    // Division-level champion - find the division function
    const divFunc = division.divisionFunctions?.find(f => f.name === champion.focusArea);
    return divFunc?.headcount || 0;
  }
}
