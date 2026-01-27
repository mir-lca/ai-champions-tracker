---
created: 2026-01-24
type: reference
jira: https://teradyne-robotics.atlassian.net/browse/AI-228
parent: https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json
---

# Organizational Data Structure - Findings & Recommendations

**Date:** 2026-01-24
**Analysis of:** https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json

## Key Findings

### 1. Actual Organization Size

**Real count: 3,331 employees** (not 8,037)

The ai-champions-tracker static data showing 8,037 is outdated. The actual organization size from Microsoft Graph is 3,331.

**Email domain distribution:**
- @teradyne.com: 2,079 (62%)
- @universal-robots.com: 583 (18%)
- @litepoint.com: 289 (9%)
- @mir-robots.com: 204 (6%)
- @nextest.com: 129 (4%)
- @teradyne-robotics.com: 42 (1%)
- Others: 5 (<1%)

### 2. CEO Direct Reports (Division/Function Heads)

Gregory Smith (CEO) has **15 direct reports:**

**Division Presidents:**
1. **Shannon Poulin** (shannon.poulin@teradyne.com) - President, Semiconductor Test Group
2. **Regan Mills** (regan.mills@teradyne.com) - President, Product Test Division
3. **Jean-Pierre Hathout** (jpha@universal-robots.com) - Div President - Robotics
4. **Walter Vahey** (walter.vahey@teradyne.com) - President, Mobile Industrial Robots
5. **Brad Robbins** (brad.robbins@litepoint.com) - President, LitePoint

**Corporate Functions (C-Suite):**
6. **Michelle Turner** (michelle.turner@teradyne.com) - VP, Chief Financial Officer
7. **Jim Mahon** (jim.mahon@teradyne.com) - Chief Human Resources Officer
8. **Ryan Driscoll** (ryan.driscoll@teradyne.com) - VP, General Counsel & Secretary

**Corporate Development/Strategic:**
9. **Tim Moriarty** (tim.moriarty@teradyne.com) - Executive Vice President, Corporate Development
10. **Amy McAndrews** (amy.mcandrews@teradyne.com) - Vice President, Corporate Development
11. **Eric Truebenbach** (eric.truebenbach@teradyne.com) - Managing Director, Teradyne Robotics Ventures

**Operations/Advisory:**
12. **Sanjay Mehta** (sanjay.mehta@teradyne.com) - VP, Executive Advisor to Operations
13. **Traci Tsuchiguchi** (traci.tsuchiguchi@teradyne.com) - Corporate Relations
14. **Ujjwal Kumar** (ujjwal.kumar@teradyne.com) - Div President - Robotics (shared account)
15. **Sandeep Kumar** (sandeep.kumar@teradyne.com) - Contractor

### 3. Division Structure (Derived from CEO Reports)

Based on job titles and email domains, the organization has these major divisions:

**1. Semiconductor Test Group** (shannon.poulin@teradyne.com)
- Likely includes: CTD, Systems Test, Memory Test, Production Board Test
- Email domain: primarily @teradyne.com

**2. Robotics Division** (multiple presidents)
- **Universal Robots (UR)**: Jean-Pierre Hathout (jpha@universal-robots.com)
  - Email domain: @universal-robots.com (583 employees)
- **Mobile Industrial Robots (MiR)**: Walter Vahey (walter.vahey@teradyne.com)
  - Email domains: @mir-robots.com (204) + @teradyne-robotics.com (42)

**3. Wireless Test / LitePoint** (brad.robbins@litepoint.com)
- Email domain: @litepoint.com (289 employees)

**4. Product Test Division** (regan.mills@teradyne.com)
- Possibly overlaps with or is parent to Semiconductor Test

**5. Corporate Functions**
- CFO, CHRO, Legal, Corporate Development, Operations
- Support functions across all divisions

**Note:** "Ujjwal Kumar-shared" and "Jean-Pierre Hathout" both have "Div President - Robotics" titles, suggesting possible dual leadership or transition.

## Division Mapping Recommendations

### Option 1: Manager Hierarchy Approach (Recommended)

**What to add to org-data-sync-function:**

1. **Division head mapping** (environment variable):
```json
ORG_DIVISION_HEADS = {
  "semiconductor-test": "shannon.poulin@teradyne.com",
  "robotics-ur": "jpha@universal-robots.com",
  "robotics-mir": "walter.vahey@teradyne.com",
  "wireless-test": "brad.robbins@litepoint.com",
  "corporate": ["michelle.turner@teradyne.com", "jim.mahon@teradyne.com", "ryan.driscoll@teradyne.com"]
}
```

2. **Division classification algorithm:**
```python
def get_employee_division(employee, all_employees, division_heads):
    """
    Traverse manager chain to find division head
    """
    current = employee
    max_depth = 20  # Prevent infinite loops

    for _ in range(max_depth):
        # Check if current employee is a division head
        for div_id, head_email in division_heads.items():
            if isinstance(head_email, list):
                if current['email'] in head_email:
                    return div_id
            else:
                if current['email'] == head_email:
                    return div_id

        # Move up to manager
        if not current.get('managerEmail'):
            return "corporate"  # Default for CEO and top-level

        # Find manager in employee list
        manager = next((e for e in all_employees if e['email'] == current['managerEmail']), None)
        if not manager:
            return "corporate"

        current = manager

    return "corporate"  # Fallback
```

3. **Enhanced employee record:**
```json
{
  "id": "guid",
  "email": "user@email.com",
  "displayName": "Name",
  "jobTitle": "Title",
  "division": "Semiconductor Test",
  "divisionId": "semiconductor-test",
  "divisionHeadEmail": "shannon.poulin@teradyne.com",
  "managerId": "manager-guid",
  "managerEmail": "manager@email.com"
}
```

**Benefits:**
- Accurate classification based on reporting structure
- Updates automatically when employees change managers
- No manual employee-to-division mapping needed

**Drawbacks:**
- Requires maintaining list of division heads
- Need to update when leadership changes

### Option 2: Email Domain Approach (Alternative)

**What to add to org-data-sync-function:**

```python
EMAIL_DOMAIN_TO_DIVISION = {
    "universal-robots.com": "robotics-ur",
    "mir-robots.com": "robotics-mir",
    "teradyne-robotics.com": "robotics",
    "litepoint.com": "wireless-test",
    "nextest.com": "semiconductor-test",
    "teradyne.com": None  # Requires manager hierarchy lookup
}
```

**Benefits:**
- Simple and fast
- Works well for acquired companies with distinct domains (UR, MiR, LitePoint)

**Drawbacks:**
- Doesn't work for @teradyne.com employees (majority)
- Doesn't capture internal division structure
- Fails when employees transfer between divisions

**Recommendation:** Use **Option 1** (Manager Hierarchy) with email domain as a hint/optimization

## Business Unit Structure

### Findings

**Business units are NOT reliably identifiable from Microsoft Graph data:**
- `businessUnit` field is null for all employees
- `department` field is mostly null
- No clear BU indicators in job titles

### Recommendation: App-Specific Definition

**Keep BU structure in ai-champions-tracker app** for these reasons:

1. **No reliable data source** - Microsoft Graph doesn't provide BU information
2. **BU definitions vary by context** - What constitutes a "business unit" depends on the app's purpose
3. **Manual mapping required** - Would need to manually map employees to BUs anyway
4. **Keeps shared service clean** - org-data-sync-function stays focused on data available from Microsoft Graph

**Implementation in ai-champions-tracker:**

```javascript
// Define BU structure with leader emails
const BUSINESS_UNITS = {
  "semiconductor-test": [
    {
      id: "ctd",
      name: "Compute Test (CTD)",
      leaders: ["leader.ctd@teradyne.com"],  // Need to identify
      keywords: ["CTD", "UltraFlex", "compute"]
    },
    {
      id: "systems-test",
      name: "Systems Test",
      leaders: ["leader.systems@teradyne.com"],
      keywords: ["systems", "J750"]
    }
    // ... other BUs
  ],
  "robotics-ur": [
    {
      id: "ur",
      name: "Universal Robots (UR)",
      leaders: ["jpha@universal-robots.com"],
      emailDomains: ["universal-robots.com"]
    }
  ],
  "robotics-mir": [
    {
      id: "mir",
      name: "Mobile Industrial Robots (MiR)",
      leaders: ["walter.vahey@teradyne.com"],
      emailDomains: ["mir-robots.com", "teradyne-robotics.com"]
    }
  ]
};

// Map employees to BUs
function mapEmployeeToBU(employee, buStructure) {
  const divisionBUs = buStructure[employee.divisionId];
  if (!divisionBUs) return null;

  // Try email domain match first
  for (const bu of divisionBUs) {
    if (bu.emailDomains?.some(domain => employee.email.endsWith(`@${domain}`))) {
      return bu.id;
    }
  }

  // Try manager hierarchy match
  for (const bu of divisionBUs) {
    if (isUnderManager(employee, bu.leaders, allEmployees)) {
      return bu.id;
    }
  }

  // Try keyword match in job title
  for (const bu of divisionBUs) {
    if (bu.keywords?.some(kw => employee.jobTitle?.toLowerCase().includes(kw.toLowerCase()))) {
      return bu.id;
    }
  }

  return null;  // Uncategorized
}
```

## Function Categories

### Findings

Job titles provide reasonable signals for function categorization:

**Engineering:**
- "Software Engineer", "Senior Software Engineer", "Principal Software Engineer"
- "Hardware Engineer", "Electrical Engineer", "Mechanical Engineer"

**Product Management:**
- "Product Manager", "Senior Product Manager", "Program Manager"

**IT:**
- "IT Manager", "IT Support", "System Administrator"

**Marketing:**
- "Marketing Manager", "Product Marketing", "Marketing Coordinator"

**Sales:**
- "Sales Engineer", "Field Application Engineer", "Account Manager"

**Applications:**
- "Application Engineer", "Applications Specialist"

### Recommendation: Add to org-data-sync-function

**Benefits of shared function classification:**
- Reusable across multiple apps
- Consistent function naming
- Based on objective job title data

**Implementation:**

```python
FUNCTION_PATTERNS = {
    "Engineering - Software": [
        r"software engineer",
        r"sw engineer",
        r"software developer",
        r"software architect"
    ],
    "Engineering - Hardware": [
        r"hardware engineer",
        r"hw engineer",
        r"electrical engineer",
        r"mechanical engineer"
    ],
    "Engineering - Applications": [
        r"applications? engineer",
        r"field application",
        r"fae"
    ],
    "Product Management": [
        r"product manager",
        r"program manager",
        r"product marketing"
    ],
    "IT": [
        r"IT ",
        r"information technology",
        r"system administrator",
        r"network engineer"
    ],
    "Marketing": [
        r"marketing",
        r"^marcom",
        r"communications"
    ],
    "Sales": [
        r"sales",
        r"account manager",
        r"business development"
    ]
}

def classify_function(job_title):
    """Classify employee function based on job title"""
    if not job_title:
        return "Other"

    title_lower = job_title.lower()

    for function_name, patterns in FUNCTION_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, title_lower, re.IGNORECASE):
                return function_name

    return "Other"
```

Add `functionCategory` field to each employee in org-hierarchy.json.

## Summary Aggregations

### Recommendation: Add to org-data-sync-function

**Include in summary object:**

```json
{
  "summary": {
    "divisions": [
      {
        "id": "semiconductor-test",
        "name": "Semiconductor Test",
        "headcount": 1500,
        "divisionHeadEmail": "shannon.poulin@teradyne.com",
        "functions": [
          {
            "category": "Engineering - Software",
            "headcount": 450
          },
          {
            "category": "Engineering - Hardware",
            "headcount": 380
          }
        ]
      }
    ],
    "corporate": [
      {
        "category": "Finance",
        "headcount": 50
      },
      {
        "category": "HR",
        "headcount": 30
      }
    ],
    "functionSummary": [
      {
        "category": "Engineering - Software",
        "totalHeadcount": 850,
        "divisionBreakdown": [
          {"divisionId": "semiconductor-test", "headcount": 450},
          {"divisionId": "robotics-ur", "headcount": 250},
          {"divisionId": "robotics-mir", "headcount": 150}
        ]
      }
    ]
  }
}
```

**Benefits:**
- Apps can display org-wide metrics without reprocessing all employees
- Consistent aggregation logic
- Faster load times for apps

## Implementation Roadmap

### Phase 1: Enhance org-data-sync-function

**Add environment variable:**
```bash
ORG_DIVISION_HEADS='{
  "semiconductor-test": "shannon.poulin@teradyne.com",
  "robotics-ur": "jpha@universal-robots.com",
  "robotics-mir": "walter.vahey@teradyne.com",
  "wireless-test": "brad.robbins@litepoint.com"
}'
```

**Update generate_org_hierarchy.py:**
1. Add division classification logic (manager hierarchy traversal)
2. Add function classification logic (job title pattern matching)
3. Add `divisionId`, `divisionHeadEmail`, `functionCategory` fields to employees
4. Generate enhanced summary with division and function breakdowns

**Expected output schema:**
```json
{
  "version": "ISO timestamp",
  "totalEmployees": 3331,
  "employees": [
    {
      "id": "guid",
      "email": "user@email.com",
      "displayName": "Name",
      "givenName": "First",
      "surname": "Last",
      "jobTitle": "Title",
      "department": null,
      "division": "Semiconductor Test",
      "divisionId": "semiconductor-test",
      "divisionHeadEmail": "shannon.poulin@teradyne.com",
      "businessUnit": null,
      "functionCategory": "Engineering - Software",
      "officeLocation": "Location",
      "managerId": "guid",
      "managerEmail": "manager@email.com"
    }
  ],
  "summary": {
    "divisions": [...],
    "corporate": [...],
    "functionSummary": [...]
  }
}
```

**Deploy and test:**
1. Run manual_sync_now.py locally to test
2. Verify division classifications are accurate
3. Deploy to Azure Function
4. Run manual sync to update CDN

### Phase 2: Update ai-champions-tracker

**Remove static data:**
- Delete `frontend/src/data/orgHierarchy.json`

**Add CDN fetch:**
```javascript
// src/api/orgDataClient.js
import { useQuery } from '@tanstack/react-query';

const ORG_DATA_CDN_URL = 'https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json';

export const useOrgData = () => {
  return useQuery({
    queryKey: ['orgData'],
    queryFn: async () => {
      const response = await fetch(ORG_DATA_CDN_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch org data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes (matches CDN cache)
    cacheTime: 60 * 60 * 1000  // 1 hour
  });
};
```

**Define BU structure:**
```javascript
// src/config/businessUnits.js
export const BUSINESS_UNITS = {
  "semiconductor-test": [
    {
      id: "ctd",
      name: "Compute Test (CTD)",
      // ... BU definition
    }
  ],
  "robotics-ur": [
    {
      id: "ur",
      name: "Universal Robots",
      emailDomains: ["universal-robots.com"]
    }
  ],
  "robotics-mir": [
    {
      id: "mir",
      name: "Mobile Industrial Robots",
      emailDomains: ["mir-robots.com", "teradyne-robotics.com"]
    }
  ],
  "wireless-test": [
    {
      id: "litepoint",
      name: "LitePoint",
      emailDomains: ["litepoint.com"]
    }
  ]
};
```

**Compute coverage:**
```javascript
// src/utils/computeCoverage.js
export function computeCoverage(orgData, championsData, buStructure) {
  // Map employees to BUs
  const employeesWithBUs = orgData.employees.map(emp => ({
    ...emp,
    businessUnitId: mapEmployeeToBU(emp, buStructure[emp.divisionId])
  }));

  // Calculate coverage by division/BU/function
  const coverage = {};

  for (const champion of championsData.champions) {
    // Mark covered employees based on champion's focus area
    const coveredEmployees = employeesWithBUs.filter(emp =>
      champion.businessUnits.some(bu => emp.businessUnitId === bu) &&
      champion.focusArea === emp.functionCategory
    );

    for (const emp of coveredEmployees) {
      coverage[emp.id] = champion.id;
    }
  }

  return {
    employeesWithBUs,
    coverage,
    stats: calculateCoverageStats(employeesWithBUs, coverage)
  };
}
```

**Update components:**
1. Replace static imports with `useOrgData()` hook
2. Add BU mapping logic
3. Compute coverage dynamically
4. Update headcount displays (3,331 instead of 8,037)

### Phase 3: Validation

**Verify:**
1. Division classifications are accurate (spot-check 50 employees)
2. Function classifications are reasonable (review "Other" category)
3. Headcounts match expectations
4. Coverage calculations work correctly in ai-champions-tracker
5. UI reflects new data correctly

**Address issues:**
- Refine function patterns if too many "Other"
- Adjust division head mapping if employees misclassified
- Update BU structure if coverage tracking inaccurate

## Next Steps

1. **Review and approve this structure** - Confirm division heads are correct
2. **Implement Phase 1** - Update org-data-sync-function with division and function classification
3. **Manual sync and validate** - Check output for accuracy
4. **Implement Phase 2** - Update ai-champions-tracker to use CDN data
5. **Deploy and monitor** - Watch for classification issues, refine patterns as needed

---

**Status:** Ready for implementation after approval
