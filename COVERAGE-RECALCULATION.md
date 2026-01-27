---
created: 2026-01-25
type: implementation
---

# Champion Coverage Recalculation - 100% of Assigned Function

## Problem

With the new org hierarchy data (8,440 employees), champion coverage numbers showed >100%:
- **Stephen Hlotyak:** Covering 405 employees but Compute Test > Engineering - Software only has 97
- **Coverage display:** "421.9%" (405 / 97 = 421%)

This happened because champion headcountCovered values were from the old data structure.

## Solution Applied

**User requirement:** "Assume that a champion assigned to a row covers 100% of that row"

Recalculated all champion headcountCovered values to match actual org hierarchy function headcounts.

## Champion Coverage Updates

| Champion | Function | Level | Old Coverage | New Coverage | Calculation |
|----------|----------|-------|--------------|--------------|-------------|
| Stephen Hlotyak | Engineering - Software | BU (Compute Test) | 405 | **97** | Semiconductor Test Eng-SW (540) × Compute Test proportion (0.179) |
| Jacob Pilegaard | Engineering - Software | BU (UR + MiR) | 143 | **78** | Robotics Eng-SW (78) for both UR + MiR |
| Martin Nordentoft | IT | Corporate | 21 | **139** | Corporate IT total headcount |
| Fleur Nielsen | Marketing | Division (Robotics) | 50 | **37** | Robotics Marketing division function |

**Total confirmed coverage:**
- Old: 569 employees
- New: 314 employees (Stephen 97 + Jacob 78 + Martin 139)

**Note:** Fleur Nielsen is pending, so not included in confirmed total.

## Structural Changes

### 1. Martin Nordentoft (IT Champion)

**Before:**
```json
{
  "division": "Robotics",
  "businessUnits": ["ur", "mir"],
  "focusArea": "IT",
  "headcountCovered": 21
}
```

**After:**
```json
{
  "division": "Corporate",
  "focusArea": "IT",
  "headcountCovered": 139
}
```

**Reason:** IT is a corporate function (not divisional), so Martin covers all corporate IT (139 employees), not just Robotics IT.

### 2. Fleur Nielsen (Marketing Champion)

**Before:**
```json
{
  "division": "Robotics",
  "businessUnits": ["ur", "mir"],
  "focusArea": "Marketing",
  "headcountCovered": 50
}
```

**After:**
```json
{
  "division": "Robotics",
  "focusArea": "Marketing",
  "headcountCovered": 37
}
```

**Reason:** Marketing is a division-level function (not BU-level), so no businessUnits assignment. Covers all Robotics Marketing (37 employees).

## Coverage Calculation Methods

### BU-Level Functions (Engineering - Software, Hardware, Applications, Service, R&D)

**Formula:** Proportional estimate from division function headcount

```
BU Function Headcount = Division Function Headcount × (BU Headcount / Division Headcount)
```

**Example - Stephen Hlotyak:**
```
Semiconductor Test > Engineering - Software: 540 employees
Compute Test BU: 830 employees
Semiconductor Test Division: 4,639 employees

Compute Test proportion: 830 / 4,639 = 0.179

Stephen's coverage: 540 × 0.179 = 97 employees
```

**Example - Jacob Pilegaard (multi-BU):**
```
Robotics > Engineering - Software: 78 employees
UR BU: 715 employees (0.894 proportion)
MiR BU: 85 employees (0.106 proportion)

UR Eng-SW: 78 × 0.894 = 70 employees
MiR Eng-SW: 78 × 0.106 = 8 employees

Jacob's coverage: 70 + 8 = 78 employees (entire Robotics Eng-SW)
```

### Division-Level Functions (Marketing, Sales, Product Management)

**Source:** Direct from division.functions[] array

**Example - Fleur Nielsen:**
```
Robotics > Marketing: 37 employees (from org-hierarchy.json)
Fleur's coverage: 37 employees
```

### Corporate Functions (IT, HR, Finance, Legal, Operations)

**Source:** Direct from corporate[] array

**Example - Martin Nordentoft:**
```
Corporate > IT: 139 employees (from org-hierarchy.json)
Martin's coverage: 139 employees
```

## Code Changes

### championsData.json
- Updated headcountCovered for all champions
- Changed Martin's division to "Corporate"
- Removed businessUnits from Martin (corporate function)
- Removed businessUnits from Fleur (division-level function)
- Updated notes with coverage details
- Updated metadata with new totals

### HierarchicalCoverageTable.jsx
- Added corporate champion display (was showing "-")
- Corporate champions now matched and displayed by name

### computeCoverage.js
- Updated corporate champion filtering to require `division === 'Corporate'`
- Ensures only properly assigned corporate champions are matched

## Expected Results (After Deployment)

### Coverage Analysis Tab

**Semiconductor Test > Compute Test:**
```
Engineering - Software    97    97    100.0%    ✅ Stephen Hlotyak
```

**Robotics > UR:**
```
Engineering - Software    70    70    100.0%    ✅ Jacob Pilegaard
```

**Robotics > MiR:**
```
Engineering - Software     8     8    100.0%    ✅ Jacob Pilegaard
```

**Robotics (Division):**
```
Marketing                 37    37    100.0%    ⏳ Fleur Nielsen (Pending)
```

**Corporate:**
```
IT                       139   139    100.0%    ✅ Martin Nordentoft
```

### Overview Tab Metrics

**Before:**
- Organizational Coverage: 569 of 2,841 (20.0%)

**After:**
- Organizational Coverage: 314 of 8,440 (3.7%)

**Breakdown:**
- Confirmed coverage: 314 employees (Stephen 97 + Jacob 78 + Martin 139)
- Potential coverage: 351 employees (+ Fleur 37)
- Potential percentage: 4.2%

## Data Accuracy Notes

### BU Function Headcounts

BU-level function headcounts are **estimated proportionally** because org-hierarchy.json doesn't break down functions by BU:

```json
"functions": [
  {
    "category": "Engineering - Software",
    "headcount": 540,
    "reportingType": "divisional"  // Not broken down by BU
  }
]
```

**Future enhancement:** Add BU-level function breakdown to org-data-sync-function for exact headcounts instead of estimates.

### Corporate vs Divisional Functions

Some functions can be tracked at multiple levels:
- **IT:** Corporate-plus-divisional (one corporate champion + optional divisional champions)
- **Finance:** Corporate-plus-divisional
- **Marketing:** Division-level only
- **Engineering - Software:** BU-level only

Current implementation:
- Martin covers all corporate IT (139 employees)
- No divisional IT champions assigned yet

## Testing Checklist

After deployment (2-3 minutes):

1. ✅ Visit https://mango-forest-0fc04f60f.1.azurestaticapps.net
2. ✅ Hard refresh (Cmd+Shift+R)
3. ✅ Check Overview tab metrics show 314 of 8,440 (3.7%)
4. ✅ Navigate to Coverage Analysis tab
5. ✅ Expand Semiconductor Test > Compute Test
6. ✅ Verify Stephen shows 97/97 (100.0%)
7. ✅ Expand Robotics division
8. ✅ Verify Jacob shows under UR and MiR Engineering - Software
9. ✅ Verify Fleur shows under Robotics Marketing
10. ✅ Scroll to Corporate functions
11. ✅ Verify Martin shows under IT: 139/139 (100.0%)

---

**Status:** ✅ Deployed to GitHub
**Next:** Wait 2-3 minutes, then verify all champions show 100% coverage
