/**
 * Find champion for specific function in division/BU
 * Pattern matching: "Software Engineering" focusArea matches "Engineering - Software" function
 */
export function getChampionForFunction(functionName, divisionName, buName, championsData) {
  const champions = championsData.champions || [];

  // Extract function type from function name (remove coverage indicators)
  const cleanFunctionName = functionName.replace(/\s*\([✅⏳❌]\)\s*/g, '').trim();

  // Pattern matching logic
  const functionPatterns = {
    'Engineering - Software': ['Software Engineering', 'Engineering - Software'],
    'Engineering - Hardware': ['Hardware Engineering', 'Engineering - Hardware'],
    'IT': ['IT', 'Information Technology'],
    'Marketing': ['Marketing'],
    'Sales': ['Sales'],
    'Service': ['Service', 'Customer Service'],
    'Product Management': ['Product Management', 'Product Manager']
  };

  // Find matching pattern
  let matchedFocusAreas = [];
  for (const [pattern, focusAreas] of Object.entries(functionPatterns)) {
    if (cleanFunctionName.includes(pattern) || pattern.includes(cleanFunctionName)) {
      matchedFocusAreas = focusAreas;
      break;
    }
  }

  if (matchedFocusAreas.length === 0) {
    return null;
  }

  // Find champion matching division, BU (if provided), and focus area
  return champions.find(champion => {
    const divisionMatch = champion.division === divisionName;
    const buMatch = !buName || (champion.businessUnits && champion.businessUnits.includes(buName));
    const focusMatch = matchedFocusAreas.some(fa =>
      champion.focusArea.includes(fa) || fa.includes(champion.focusArea)
    );

    return divisionMatch && buMatch && focusMatch;
  });
}
