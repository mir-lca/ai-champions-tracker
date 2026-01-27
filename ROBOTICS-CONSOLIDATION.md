---
created: 2026-01-25
type: implementation
---

# Robotics Division Consolidation & Martin's Scope Adjustment

## Changes Requested

1. **Consolidate Robotics division** - Don't show UR and MiR as separate business units
2. **Martin Nordentoft scope** - Cover Robotics IT only (not all corporate IT)

## Implementation

### 1. Robotics Division Consolidation

**Before:**
```
Robotics                                800    215    26.9%
  Universal Robots (UR)                 715    XXX    XX.X%
    Engineering - Software               70    XXX    XX.X%    ✅ Jacob Pilegaard
    Engineering - Hardware               XX     XX    XX.X%
    ...
  Mobile Industrial Robots (MiR)         85    XXX    XX.X%
    Engineering - Software                8    XXX    XX.X%    ✅ Jacob Pilegaard
    Engineering - Hardware               XX     XX    XX.X%
    ...
  Marketing                              37     37   100.0%    ⏳ Fleur Nielsen
```

**After:**
```
Robotics                                800    128    16.0%
  Engineering - Software                 78     78   100.0%    ✅ Jacob Pilegaard
  IT                                     13     13   100.0%    ✅ Martin Nordentoft
  Marketing                              37     37   100.0%    ⏳ Fleur Nielsen
  (Other division-level functions...)
```

**How it works:**
- HierarchicalCoverageTable.jsx skips rendering business units for Robotics
- Business units still exist in org data but not displayed
- Division-level and BU-level functions still calculated correctly
- Jacob's coverage still applies to UR + MiR (just not shown separately)

### 2. Martin Nordentoft Scope Change

**Before:**
```json
{
  "name": "Martin Nordentoft",
  "division": "Corporate",
  "focusArea": "IT",
  "headcountCovered": 139
}
```

**After:**
```json
{
  "name": "Martin Nordentoft",
  "division": "Robotics",
  "focusArea": "IT",
  "headcountCovered": 13
}
```

**Rationale:**
- Martin is the IT director in Robotics
- Covers his direct and indirect reports (13 employees)
- IT is a "corporate-plus-divisional" function
- Can have both corporate IT champion AND divisional IT champions

### 3. IT Function Configuration

**orgStructure.js changes:**

Added IT to DIVISION_FUNCTIONS:
```javascript
export const DIVISION_FUNCTIONS = [
  'Marketing',
  'Sales',
  'Product Management',
  'IT'  // Added for corporate-plus-divisional tracking
];
```

**IT remains in CORPORATE_FUNCTIONS:**
```javascript
export const CORPORATE_FUNCTIONS = [
  'HR',
  'Finance',
  'IT',  // Still here - corporate-plus-divisional
  ...
];
```

**MATRIX_SCOPE configuration:**
```javascript
'IT': {
  scope: 'corporate-plus-divisional',  // Can have both levels
  level: 'corporate'                    // Primary level is corporate
}
```

### 4. Divisional IT Headcount Estimation

Since org-hierarchy.json only has IT at corporate level (139 employees), we estimate divisional IT proportionally:

**Formula:**
```
Division IT Headcount = Corporate IT Total × (Division Headcount / Total Org Headcount)
```

**For Robotics:**
```
Corporate IT: 139 employees
Robotics headcount: 800 employees
Total org: 8,440 employees

Robotics proportion: 800 / 8,440 = 0.095
Estimated Robotics IT: 139 × 0.095 = 13 employees
```

**Implementation in computeCoverage.js:**
```javascript
// Special handling for corporate-plus-divisional functions (like IT)
if (headcount === 0 && funcName === 'IT') {
  const corporateIT = orgHierarchy.summary?.corporate?.find(
    cf => cf.category === 'IT'
  );
  if (corporateIT) {
    const divisionProportion = division.headcount / orgHierarchy.totalEmployees;
    headcount = Math.round(corporateIT.headcount * divisionProportion);
  }
}
```

## Coverage Model Change (2026-01-27)

### Dynamic Coverage Calculation

**Old Model:**
- Champions stored `headcountCovered` field with static numbers
- Required manual updates when org data changed
- Could become stale/inaccurate

**New Model:**
- Champions only store assignment (division + focusArea + optional businessUnits)
- Coverage calculated dynamically as 100% of assigned function's current headcount
- Automatically adapts to org hierarchy changes

**Champion Structure:**
```json
{
  "name": "Martin Nordentoft",
  "division": "Robotics",
  "focusArea": "IT",
  "businessUnits": null  // null = division-level, array = BU-level
}
```

**Coverage Calculation:**
- If champion assigned → covered = function headcount from org-hierarchy.json (100%)
- If no champion → covered = 0
- Total coverage = sum of all function coverage from enhanced org hierarchy

## Coverage Impact

### Total Confirmed Coverage (Dynamic)

**Current Champions:**
- Stephen: Semiconductor Test > Compute Test > Engineering - Software (100% of function)
- Jacob: Robotics > Engineering - Software (100% of function)
- Martin: Robotics > IT (100% of function)
- **Total: Calculated dynamically from org-hierarchy.json**

**Example with current data:**
- Stephen: 97 employees (function headcount)
- Jacob: 78 employees (function headcount)
- Martin: 13 employees (function headcount)
- **Total: 188 employees (2.2% of 8,440)**

### Coverage by Division

**Semiconductor Test:**
- Stephen covers Compute Test Engineering - Software: 97 employees

**Robotics:**
- Jacob covers Engineering - Software: 78 employees
- Martin covers IT: 13 employees
- **Total Robotics confirmed coverage: 91 employees (11.4% of 800)**

**Potential coverage (if Fleur confirmed):**
- Add Fleur's Marketing: 37 employees
- **Total: 225 employees (2.7% of 8,440)**

## IT Function Hierarchy

### Current State

**Corporate IT:**
- Total: 139 employees
- Champion: None assigned yet
- Scope: All of Teradyne

**Divisional IT (Robotics):**
- Total: 13 employees (estimated)
- Champion: Martin Nordentoft
- Scope: Robotics division only

**Divisional IT (Other divisions):**
- Semiconductor Test: ~76 employees (estimated)
- Product Test: ~13 employees (estimated)
- Champions: Not assigned yet

### Future IT Champion Strategy

With corporate-plus-divisional configuration, IT can have:
1. **One corporate IT champion** covering all 139 employees
2. **Divisional IT champions** for specific divisions (like Martin)

**Recommended approach:**
- Corporate IT champion for overall IT strategy/infrastructure
- Divisional IT champions for division-specific IT support
- Both levels can co-exist

## Expected Results (After Deployment)

### Coverage Analysis Tab

**Robotics Division (Consolidated):**
```
Division: Robotics                           800    128    16.0%
  Engineering - Software                      78     78   100.0%    ✅ Jacob Pilegaard
  IT                                          13     13   100.0%    ✅ Martin Nordentoft
  Marketing                                   37     37   100.0%    ⏳ Fleur Nielsen (Pending)
  Sales                                      123      0     0.0%    ❌ Gap
  Service                                     81      0     0.0%    ❌ Gap
  Engineering - Applications                  73      0     0.0%    ❌ Gap
  R&D                                         42      0     0.0%    ❌ Gap
  Engineering - Hardware                      38      0     0.0%    ❌ Gap
  Product Management                          19      0     0.0%    ❌ Gap
  Operations                                  15      0     0.0%    ❌ Gap
  Finance                                      2      0     0.0%    ❌ Gap
```

**Note:** UR and MiR business units no longer shown separately.

### Overview Tab Metrics

**Organizational Coverage:**
- Confirmed: 188 of 8,440 (2.2%)
- Potential: 225 of 8,440 (2.7%) if Fleur confirmed

**Champions by Division:**
- Semiconductor Test: 1 champion (Stephen)
- Robotics: 2 champions (Jacob, Martin) + 1 pending (Fleur)
- Product Test: 0 champions

## Testing Checklist

After deployment (2-3 minutes):

1. ✅ Visit https://mango-forest-0fc04f60f.1.azurestaticapps.net
2. ✅ Hard refresh (Cmd+Shift+R)
3. ✅ Navigate to Coverage Analysis tab
4. ✅ Expand Robotics division
5. ✅ Verify NO business units shown (no UR, no MiR)
6. ✅ Verify Engineering - Software shows: 78/78 (100%) ✅ Jacob Pilegaard
7. ✅ Verify IT shows: 13/13 (100%) ✅ Martin Nordentoft
8. ✅ Verify Marketing shows: 37/37 (100%) ⏳ Fleur Nielsen
9. ✅ Check Overview tab shows 188 of 8,440 (2.2%)

---

**Status:** ✅ Deployed to GitHub
**Next:** Wait 2-3 minutes, verify Robotics consolidated view and Martin covering Robotics IT only
