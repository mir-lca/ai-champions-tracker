---
created: 2026-01-25
type: implementation
---

# Fix: Inconsistent Coverage Data (Mixed Old/New Data Sources)

**Problem:** App showed inconsistent employee counts - some parts used new CDN data (8,440 employees), others used hardcoded old data (2,841 employees).

## Symptoms

**Before fix:**
- Header: "Organizational coverage across Teradyne's **8,440 employees**" ✅ (correct)
- Organizational Coverage card: "**569 of 2,841 employees**" ❌ (wrong)
- Coverage percentage: **20.0%** ❌ (wrong)
- Division breakdown table: Used correct data ✅

**Root cause:** Mixed data sources
- `orgHierarchy.totalEmployees` (CDN) = 8,440 ✅
- `championsData.metadata.totalOrg` (hardcoded) = 2,841 ❌

## Solution

### Files Changed

**frontend/src/App.jsx:**
```javascript
// OLD: Used hardcoded metadata
const coveragePercentage = championsData.metadata.coveragePercentage

// NEW: Calculate from live CDN data
const totalOrgEmployees = orgHierarchy.totalEmployees || 0
const totalCoveredEmployees = championsData.champions
  .filter(c => c.status === 'confirmed')
  .reduce((sum, c) => sum + c.headcountCovered, 0)

const coveragePercentage = totalOrgEmployees > 0
  ? ((totalCoveredEmployees / totalOrgEmployees) * 100).toFixed(1)
  : '0.0'
```

**frontend/src/data/championsData.json:**
```json
// OLD:
"metadata": {
  "totalOrg": 2841,
  "totalCovered": 569,
  "coveragePercentage": 20.0
}

// NEW:
"metadata": {
  "note": "totalOrg and coveragePercentage are now calculated dynamically from live CDN data",
  "totalCoveredByConfirmedChampions": 569
}
```

## Results

**After fix:**
- All metrics use consistent live CDN data (8,440 employees)
- Organizational Coverage: **569 of 8,440 employees (6.7%)**
- Potential Coverage: Recalculated correctly
- No more hardcoded employee counts

**Coverage calculation:**
- Old: 569 / 2,841 = 20.0% ❌
- New: 569 / 8,440 = 6.7% ✅

## Testing

1. Wait for GitHub Actions deployment (2-3 minutes)
2. Visit https://mango-forest-0fc04f60f.1.azurestaticapps.net
3. Hard refresh (Cmd+Shift+R)
4. Verify all metrics show 8,440 employee base

## Data Flow (After Fix)

```
org-data-sync-function (Azure Function)
  → Fetches 8,440 employees from Microsoft Graph
  → Uploads to CDN (org-hierarchy.json)
     ↓
ai-champions-tracker (React app)
  → useOrgHierarchy() hook fetches from CDN
  → orgHierarchy.totalEmployees = 8,440
  → All coverage calculations use this value ✅
```

## Prevention

To avoid similar issues:
1. Never hardcode employee counts in app code
2. Always use `orgHierarchy.totalEmployees` from CDN
3. Calculate coverage dynamically, not statically
4. Keep championsData.json focused on champion assignments only

---

**Status:** ✅ Fixed and deployed
**Next:** Monitor production to ensure all metrics show consistent data
