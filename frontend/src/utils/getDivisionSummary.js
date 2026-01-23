/**
 * Compute division summary from orgHierarchy and champions data
 * Returns array of {division, champions, covered, total, coverage}
 */
export function getDivisionSummary(orgHierarchy, championsData) {
  const divisions = orgHierarchy.divisions || [];
  const champions = championsData.champions || [];

  return divisions.map(division => {
    // Count champions in this division
    const divisionChampions = champions.filter(
      c => c.division === division.name && c.status === 'confirmed'
    );

    return {
      division: division.name,
      champions: divisionChampions.length,
      covered: division.covered,
      total: division.headcount,
      coverage: division.covered > 0
        ? ((division.covered / division.headcount) * 100).toFixed(1)
        : '0.0'
    };
  });
}
