---
created: 2026-01-25
type: analysis
---

# Coverage Analysis Headcount Gap Analysis

## Current State

### What HAS Headcount (✅)

**In Coverage Analysis table:**
1. **Divisions** (line 62): `division.headcount`
   - Example: Semiconductor Test: 4,639
2. **Business Units** (line 118): `bu.headcount`
   - Example: Compute Test: 830
3. **Corporate Functions** (line 174): `corp.headcount`
   - Example: IT: 142

### What's MISSING Headcount (❌)

**In Coverage Analysis table:**
1. **Division-level Functions** (line 83): Shows "-"
   - Example: Marketing, Sales, Product Management
2. **BU-level Functions** (line 137): Shows "-"
   - Example: Engineering - Software, Engineering - Hardware, etc.
3. **Corporate Sub-functions** (line 191): Shows "-"
   - Currently not used (subFunctions array empty)

## Data Availability Assessment

### ✅ Data ALREADY EXISTS in CDN

The org hierarchy JSON **already contains** function-level headcount data:

```json
{
  "summary": {
    "divisions": [
      {
        "name": "Semiconductor Test",
        "headcount": 4639,
        "functions": [
          {
            "category": "Engineering - Software",
            "headcount": 540,
            "reportingType": "divisional"
          },
          {
            "category": "Engineering - Applications",
            "headcount": 788,
            "reportingType": "divisional"
          },
          {
            "category": "Sales",
            "headcount": 141,
            "reportingType": "divisional"
          }
        ]
      }
    ],
    "corporate": [
      {
        "category": "IT",
        "headcount": 142,
        "reportingType": "corporate"
      }
    ]
  }
}
```

**Verdict:** NO changes needed to org-data-sync-function or CDN data structure. ✅

## Problem: Frontend Not Using Available Data

### Root Cause

**File:** `frontend/src/utils/computeCoverage.js` (lines 47-52)

The `enhanceWithCoverage()` function creates division functions WITHOUT including headcount:

```javascript
// Current implementation (WRONG)
const divisionFunctions = DIVISION_FUNCTIONS.map(funcName => {
  const hasChampion = divisionChampions.some(
    c => c.focusArea === funcName
  );
  return hasChampion ? `${funcName} (✅)` : `${funcName} (❌)`;
});
```

This returns:
- `["Marketing (❌)", "Sales (❌)", "Product Management (❌)"]`

**Missing:** Headcount data from `division.functions[]` array.

### Same Issue for BU Functions

**File:** `frontend/src/utils/computeCoverage.js` (lines 68-73)

```javascript
// Current implementation (WRONG)
const buFunctions = BU_FUNCTIONS.map(funcName => {
  const hasChampion = buChampions.some(
    c => c.focusArea === funcName
  );
  return hasChampion ? `${funcName} (✅)` : `${funcName} (❌)`;
});
```

Same problem - returns strings instead of objects with headcount.

## Solution Design

### Option 1: Enhance Function Objects (RECOMMENDED)

Instead of returning strings, return objects with function metadata:

```javascript
// Enhanced structure
const divisionFunctions = DIVISION_FUNCTIONS.map(funcName => {
  const hasChampion = divisionChampions.some(
    c => c.focusArea === funcName
  );

  // Find function in org data
  const funcData = division.functions?.find(
    f => f.category === funcName
  );

  return {
    name: funcName,
    headcount: funcData?.headcount || 0,
    covered: hasChampion ? (champion.headcountCovered || 0) : 0,
    coverage: hasChampion ? 'full' : 'gap',
    indicator: hasChampion ? '✅' : '❌'
  };
});
```

**Benefits:**
- Preserves all metadata
- Easy to extract headcount in UI
- Consistent with division/BU structure

### Option 2: Keep Strings, Add Separate Headcount Array

Keep current string format, add parallel headcount data:

```javascript
// Not recommended - harder to maintain
divisionFunctions: ["Marketing (❌)", "Sales (❌)"],
divisionFunctionHeadcounts: {
  "Marketing": 20,
  "Sales": 141
}
```

**Drawbacks:**
- Fragile (arrays must stay in sync)
- Harder to maintain
- Inconsistent with rest of structure

## Recommended Implementation

### Files to Change

**1. frontend/src/utils/computeCoverage.js**
- Update `enhanceWithCoverage()` to return function objects (not strings)
- Include headcount, covered, coverage indicator
- Apply to both division and BU functions

**2. frontend/src/components/champions/HierarchicalCoverageTable.jsx**
- Update function rendering to use new object structure
- Display `func.headcount` instead of "-"
- Display `func.covered` if available
- Calculate coverage percentage

### Data Flow

```
org-hierarchy.json (CDN)
  division.functions[] = [
    { category: "Sales", headcount: 141, reportingType: "divisional" }
  ]
     ↓
computeCoverage.js: enhanceWithCoverage()
  Match with DIVISION_FUNCTIONS config
  Find champion if exists
  Build function object with headcount
     ↓
HierarchicalCoverageTable.jsx
  Display func.headcount in table
  Show coverage metrics
```

## Expected Results

### Before (Current)
```
Division: Semiconductor Test          4,639    548    11.8%
  Marketing                              -      -       -
  Sales                                  -      -       -
  Product Management                     -      -       -
```

### After (With Fix)
```
Division: Semiconductor Test          4,639    548    11.8%
  Marketing                              20      0     0.0%
  Sales                                 141      0     0.0%
  Product Management                     70      0     0.0%
```

## Implementation Complexity

**Effort:** Medium (2-3 hours)

**Steps:**
1. ✅ Update `computeCoverage.js` to build function objects
2. ✅ Update `HierarchicalCoverageTable.jsx` to render objects
3. ✅ Test with live data
4. ✅ Deploy

**Risk:** Low
- Data already exists in CDN
- No backend changes needed
- Only frontend display logic changes

## Summary

| Aspect | Status |
|--------|--------|
| **Data availability** | ✅ Already in CDN |
| **Backend changes** | ❌ Not needed |
| **Frontend changes** | ✅ Required (2 files) |
| **Complexity** | Medium |
| **Risk** | Low |

**Verdict:** This is a frontend-only fix. The org data source already contains all necessary headcount information. We just need to use it properly in the Coverage Analysis table.
