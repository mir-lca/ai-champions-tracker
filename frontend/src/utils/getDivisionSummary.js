/**
 * Compute division summary from orgHierarchy and champions data
 * Returns array of {division, champions, covered, total, coverage}
 *
 * Uses enhanced org hierarchy structure (summary.divisions) from CDN
 */
export function getDivisionSummary(orgHierarchy, championsData) {
  const divisions = orgHierarchy.summary?.divisions || [];
  const champions = championsData.champions || [];

  return divisions.map(division => {
    // Count champions in this division (confirmed only)
    const divisionChampions = champions.filter(
      c => c.division === division.name && c.status === 'confirmed'
    );

    // Compute covered headcount by summing champions' covered employees
    const covered = divisionChampions.reduce(
      (sum, champion) => sum + (champion.headcountCovered || 0),
      0
    );

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
