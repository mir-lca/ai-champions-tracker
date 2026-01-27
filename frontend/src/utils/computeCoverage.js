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
 * Compute actual per-BU function headcounts from employee-level data
 *
 * @param {Object} orgHierarchy - Org hierarchy with employees array
 * @param {string} divisionName - Division name
 * @param {string} businessUnitId - Business unit ID
 * @returns {Object} Map of functionCategory -> headcount
 */
function computeBUFunctionCounts(orgHierarchy, divisionName, businessUnitId) {
  if (!orgHierarchy.employees) {
    return {};
  }

  const functionCounts = {};

  // Count employees by function for this specific BU
  orgHierarchy.employees.forEach(emp => {
    if (emp.division === divisionName &&
        emp.businessUnitId === businessUnitId &&
        emp.functionCategory) {
      const func = emp.functionCategory;
      functionCounts[func] = (functionCounts[func] || 0) + 1;
    }
  });

  return functionCounts;
}

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

        // Get actual headcount by summing across all Robotics BUs
        let headcount = 0;
        (division.businessUnits || []).forEach(bu => {
          const buFunctionCounts = computeBUFunctionCounts(orgHierarchy, division.name, bu.id);
          headcount += buFunctionCounts[funcName] || 0;
        });

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

    // Calculate division-level function coverage (will add BU coverage later)
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

      // Compute actual per-BU function counts from employee data
      const buFunctionCounts = computeBUFunctionCounts(orgHierarchy, division.name, bu.id);

      // Get BU-level functions that should be tracked
      const buFunctions = BU_FUNCTIONS.map(funcName => {
        // Find champion for this function
        const champion = buChampions.find(
          c => c.focusArea === funcName
        );

        // Get actual headcount from employee data
        const headcount = buFunctionCounts[funcName] || 0;

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

    // Add BU coverage to division coverage (unless Robotics, which already includes BU functions in divisionFunctions)
    if (division.name !== 'Robotics') {
      covered += enhancedBusinessUnits.reduce((sum, bu) => sum + bu.covered, 0);
    }

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
 * Generate unassigned champion entries for functions without champions
 *
 * @param {Object} enhancedOrgHierarchy - Enhanced org hierarchy with coverage data
 * @param {Object} championsData - Existing champions data
 * @returns {Array} Array of unassigned champion objects
 */
export function generateUnassignedChampions(enhancedOrgHierarchy, championsData) {
  const unassigned = [];
  const champions = championsData.champions || [];

  // Helper to check if a function has a champion
  const hasChampion = (division, focusArea, businessUnitId = null) => {
    return champions.some(c => {
      if (c.division !== division || c.focusArea !== focusArea) return false;

      if (businessUnitId) {
        return c.businessUnits && c.businessUnits.includes(businessUnitId);
      } else {
        return !c.businessUnits || c.businessUnits.length === 0;
      }
    });
  };

  // Check corporate functions
  if (enhancedOrgHierarchy.corporate) {
    enhancedOrgHierarchy.corporate.forEach(corp => {
      if (!hasChampion('Corporate', corp.name)) {
        unassigned.push({
          id: `unassigned-corporate-${corp.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: 'Unassigned',
          division: 'Corporate',
          focusArea: corp.name,
          businessUnits: null,
          headcountCovered: corp.headcount,
          status: 'unassigned'
        });
      }
    });
  }

  // Check divisions
  if (enhancedOrgHierarchy.divisions) {
    enhancedOrgHierarchy.divisions.forEach(division => {
      // Check division-level functions
      if (division.divisionFunctions) {
        division.divisionFunctions.forEach(func => {
          if (!hasChampion(division.name, func.name)) {
            unassigned.push({
              id: `unassigned-${division.id}-${func.name.toLowerCase().replace(/\s+/g, '-')}`,
              name: 'Unassigned',
              division: division.name,
              focusArea: func.name,
              businessUnits: null,
              headcountCovered: func.headcount,
              status: 'unassigned'
            });
          }
        });
      }

      // Check BU-level functions (skip for Robotics as BU functions shown at division level)
      if (division.name !== 'Robotics' && division.businessUnits) {
        division.businessUnits.forEach(bu => {
          if (bu.functions) {
            bu.functions.forEach(func => {
              if (!hasChampion(division.name, func.name, bu.id)) {
                unassigned.push({
                  id: `unassigned-${bu.id}-${func.name.toLowerCase().replace(/\s+/g, '-')}`,
                  name: 'Unassigned',
                  division: division.name,
                  businessUnit: bu.name,
                  focusArea: func.name,
                  businessUnits: [bu.id],
                  headcountCovered: func.headcount,
                  status: 'unassigned'
                });
              }
            });
          }
        });
      }
    });
  }

  return unassigned;
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
    // BU-level champion - sum across all assigned BUs
    let totalHeadcount = 0;

    for (const buId of champion.businessUnits) {
      // Compute actual function counts for this BU
      const buFunctionCounts = computeBUFunctionCounts(
        enhancedOrgHierarchy,
        champion.division,
        buId
      );
      totalHeadcount += buFunctionCounts[champion.focusArea] || 0;
    }

    return totalHeadcount;
  } else {
    // Division-level champion - find the division function
    const divFunc = division.divisionFunctions?.find(f => f.name === champion.focusArea);
    return divFunc?.headcount || 0;
  }
}
