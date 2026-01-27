/**
 * Compute division summary from enhanced orgHierarchy with coverage data
 * Returns array of {division, champions, covered, total, coverage}
 *
 * Uses enhanced org hierarchy structure (with coverage computed) from enhanceWithCoverage()
 */
export function getDivisionSummary(enhancedOrgHierarchy, championsData) {
  const divisions = enhancedOrgHierarchy.divisions || [];
  const champions = championsData.champions || [];

  return divisions.map(division => {
    // Count champions in this division (confirmed only)
    const divisionChampions = champions.filter(
      c => c.division === division.name && c.status === 'confirmed'
    );

    // Use pre-computed coverage from enhanced org hierarchy
    const covered = division.covered || 0;

    return {
      division: division.name,
      champions: divisionChampions.length,
      covered: covered,
      total: division.headcount,
      coverage: covered > 0
        ? ((covered / division.headcount) * 100).toFixed(1)
        : '0.0'
    };
  });
}
