---
created: 2026-01-24
type: analysis
jira: https://teradyne-robotics.atlassian.net/browse/AI-228
---

# Organizational Data Structure Analysis

**Purpose:** Determine what organizational structure data should be included in the shared `org-hierarchy.json` from `org-data-sync-function` versus what should be computed/defined in the `ai-champions-tracker` app.

**Date:** 2026-01-24
**CDN Source:** https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json

## Current State

### Available from CDN (org-data-sync-function)

**Data Source:** Microsoft Graph API
**Root:** gregory.smith@teradyne.com (CEO)
**Total Employees:** 3,331

**Structure:**
```json
{
  "version": "2026-01-24T12:09:43.981041+00:00",
  "totalEmployees": 3331,
  "employees": [
    {
      "id": "user-guid",
      "email": "user@teradyne.com",
      "displayName": "Full Name",
      "givenName": "First",
      "surname": "Last",
      "jobTitle": "Job Title from Azure AD",
      "department": null,           // ⚠️ Mostly null
      "division": "Corporate",       // ⚠️ Default for most employees
      "businessUnit": null,          // ⚠️ Mostly null
      "officeLocation": "Location or null",
      "managerId": "manager-guid or null",
      "managerEmail": "manager@email or null"
    }
  ],
  "summary": {
    "divisions": [],
    "corporate": []
  }
}
```

**Key Limitations:**
- ❌ `department` field is null for most employees (Azure AD data quality issue)
- ❌ `businessUnit` field is null for most employees
- ❌ `division` defaults to "Corporate" for employees without Azure AD company/department
- ✅ Manager relationships are accurate and complete
- ✅ Individual employee details (name, email, job title, location) are accurate
- ✅ Org hierarchy is correct (can traverse from CEO down)

### Expected by ai-champions-tracker

**Data Source:** Static JSON (manually maintained)
**Total Employees:** 8,037 (outdated count)

**Structure:**
```json
{
  "version": "2026-01-23T10:00:00Z",
  "totalEmployees": 8037,
  "divisions": [
    {
      "id": "semiconductor-test",
      "name": "Semiconductor Test",
      "headcount": 5000,
      "covered": 405,              // ⚠️ App-specific field
      "coverage": "partial",        // ⚠️ App-specific field
      "businessUnits": [
        {
          "id": "ctd",
          "name": "Compute Test (CTD)",
          "headcount": 1500,
          "covered": 405,            // ⚠️ App-specific field
          "coverage": "partial",     // ⚠️ App-specific field
          "functions": [
            "Engineering - Software (✅)",  // ⚠️ App-specific coverage marker
            "Engineering - Hardware",
            "Applications",
            "Product Management"
          ]
        }
      ],
      "divisionFunctions": [
        "IT",
        "Marketing",
        "Sales",
        "Service"
      ]
    }
  ]
}
```

**Key Requirements:**
- ✅ Hierarchical structure: Divisions → Business Units → Functions
- ✅ Headcount at each level
- ❌ "covered" and "coverage" are app-specific (for champions tracker only)
- ❌ Coverage markers (✅/⏳/❌) are app-specific
- ❓ Division/BU/function mapping needs to be defined

## Gap Analysis

### 1. Division Classification

**Question:** How do we identify which division an employee belongs to?

**Current Reality:**
- Azure AD `department` field is unreliable (mostly null)
- Azure AD `companyName` field could indicate division but is also sparse
- Current org-data-sync-function defaults to "Corporate" for most employees

**Options:**

**Option A: Manager-based classification (Recommended)**
- Use manager hierarchy to determine division
- Define "division head" employees (e.g., presidents of each division)
- Traverse from employee → managers → find division head
- Accurate but requires maintaining list of division heads

**Option B: Department/Company field mapping**
- Map Azure AD department/company strings to divisions
- Example: "Robotics" → Robotics division, "CTD" → Semiconductor Test division
- Unreliable due to data quality issues

**Option C: Manual mapping file**
- Maintain mapping of email → division in separate file
- Labor-intensive and requires updates when employees change roles
- Not scalable

**Recommendation:** **Option A** - Manager-based classification with defined division heads

### 2. Business Unit Classification

**Question:** How do we identify business units within divisions?

**Current Reality:**
- Azure AD doesn't have a "business unit" field
- Business units are logical groupings (e.g., UR, MiR, CTD, Systems Test)

**Options:**

**Option A: Define BU leaders in org-data-sync-function**
- Similar to division heads, maintain list of BU leaders
- Use manager hierarchy to map employees to BUs
- Keeps classification logic in shared service

**Option B: Map job titles/departments to BUs**
- Use pattern matching on job titles or departments
- Example: "MiR Software Engineer" → MiR BU
- Unreliable due to inconsistent naming

**Option C: Keep BU mapping app-specific**
- ai-champions-tracker defines its own BU structure
- App maps employees to BUs based on its own business logic
- Keeps shared org data service clean

**Recommendation:** **Option A or C** depending on whether BU structure is organization-wide or app-specific

### 3. Function Classification

**Question:** How do we identify functional areas (Engineering - Software, Marketing, IT, etc.)?

**Current Reality:**
- Functions are logical groupings within divisions/BUs
- Azure AD job titles could indicate function (e.g., "Software Engineer" → Engineering - Software)

**Options:**

**Option A: Job title pattern matching in org-data-sync-function**
- Map job titles to standardized functions
- Example: "Software Engineer", "Senior Software Engineer" → "Engineering - Software"
- Requires comprehensive pattern matching rules

**Option B: Job title pattern matching in app**
- Each app defines its own function mapping
- Keeps shared service generic
- Allows apps to have custom function breakdowns

**Option C: Define function leaders**
- Similar to division/BU heads, maintain list of function leaders
- Map employees via manager hierarchy
- Most accurate but requires maintaining leader lists

**Recommendation:** **Option A or B** - Job title pattern matching, decide whether shared or app-specific

### 4. Headcount Aggregation

**Question:** How do we calculate headcount at each level (division, BU, function)?

**Current Reality:**
- Total employees: 3,331 (actual from Microsoft Graph)
- Static data shows: 8,037 (outdated)

**Options:**

**Option A: Count in org-data-sync-function**
- Pre-calculate headcounts for divisions/BUs/functions
- Include in summary object
- Faster for apps but requires structure definition in shared service

**Option B: Count in app**
- App filters employees array and counts
- More flexible but slower
- Apps can define custom aggregations

**Recommendation:** **Option A** if structure is defined in shared service, **Option B** if structure is app-specific

## Proposed Approach

### Phase 1: Enhance org-data-sync-function (Shared Service)

**Add to org-hierarchy.json:**

1. **Division Mapping**
   - Define list of division head emails in `ORG_DIVISION_HEADS` environment variable
   - Format: `{"Semiconductor Test": "president.semicon@teradyne.com", "Robotics": "president.robotics@teradyne.com"}`
   - Add `divisionId` field to each employee (computed from manager hierarchy)

2. **Basic Function Mapping**
   - Add job title pattern matching for common functions
   - Example patterns:
     - "Software Engineer", "Senior Software Engineer", "Principal Software Engineer" → "Engineering - Software"
     - "Hardware Engineer", "Electrical Engineer" → "Engineering - Hardware"
     - "Product Manager", "Program Manager" → "Product Management"
   - Add `functionCategory` field to each employee (computed from job title)

3. **Enhanced Summary**
   - Add division breakdown with real headcounts
   - Add function breakdown within divisions
   - Do NOT include app-specific fields (covered, coverage)

**Updated Schema:**
```json
{
  "version": "ISO timestamp",
  "totalEmployees": 3331,
  "employees": [
    {
      "id": "user-guid",
      "email": "user@email.com",
      "displayName": "Name",
      "givenName": "First",
      "surname": "Last",
      "jobTitle": "Title",
      "department": null,
      "division": "Robotics",              // ✅ Enhanced via division heads
      "divisionId": "robotics",            // ✅ NEW: kebab-case ID
      "businessUnit": null,                // ⚠️ Still null (no reliable source)
      "businessUnitId": null,              // ⚠️ Still null
      "functionCategory": "Engineering - Software",  // ✅ NEW: Computed from job title
      "officeLocation": "Location",
      "managerId": "manager-guid",
      "managerEmail": "manager@email.com"
    }
  ],
  "summary": {
    "divisions": [
      {
        "id": "semiconductor-test",
        "name": "Semiconductor Test",
        "headcount": 2500,
        "functions": [
          {
            "name": "Engineering - Software",
            "headcount": 450
          },
          {
            "name": "Engineering - Hardware",
            "headcount": 380
          }
        ]
      },
      {
        "id": "robotics",
        "name": "Robotics",
        "headcount": 800,
        "functions": [
          {
            "name": "Engineering - Software",
            "headcount": 180
          },
          {
            "name": "IT",
            "headcount": 21
          }
        ]
      }
    ],
    "corporate": [
      {
        "name": "Operations",
        "headcount": 31,
        "functions": [...]
      }
    ]
  }
}
```

### Phase 2: Update ai-champions-tracker (App-Specific)

**App defines:**

1. **Business Unit Structure**
   - Define BU structure in app configuration
   - Map employees to BUs based on app's business logic
   - Example: Use manager hierarchy, email patterns, or manual mapping

2. **Coverage Tracking**
   - Add "covered" and "coverage" fields in app state
   - Compute based on champions assignments
   - Never stored in shared org-hierarchy.json

3. **App-Specific Aggregations**
   - Calculate coverage percentages
   - Track champion assignments
   - Generate gap analysis

**Implementation:**

```javascript
// App fetches shared org data
const orgData = await fetch('https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json')
  .then(r => r.json());

// App defines BU structure (app-specific)
const BU_STRUCTURE = {
  "semiconductor-test": [
    { id: "ctd", name: "Compute Test (CTD)", leaders: ["leader1@teradyne.com"] },
    { id: "systems-test", name: "Systems Test", leaders: ["leader2@teradyne.com"] }
  ],
  "robotics": [
    { id: "ur", name: "Universal Robots (UR)", leaders: ["leader3@teradyne.com"] },
    { id: "mir", name: "Mobile Industrial Robots (MiR)", leaders: ["leader4@teradyne.com"] }
  ]
};

// App maps employees to BUs
const employeesWithBUs = orgData.employees.map(emp => ({
  ...emp,
  businessUnit: mapEmployeeToBU(emp, BU_STRUCTURE)  // App logic
}));

// App computes coverage
const coverage = computeCoverage(employeesWithBUs, championsData);  // App logic
```

## Decision Matrix

| Data Element | Source | Where to Define | Rationale |
|-------------|--------|-----------------|-----------|
| **Individual Employees** | Microsoft Graph | org-data-sync-function | Universal across all apps |
| **Manager Relationships** | Microsoft Graph | org-data-sync-function | Universal across all apps |
| **Division Classification** | Computed | org-data-sync-function | Organization-wide structure, reusable |
| **Division Headcounts** | Computed | org-data-sync-function | Derived from division classification |
| **Function Categories** | Computed | org-data-sync-function | Common across apps, based on job titles |
| **Business Units** | Defined | App-specific | BU structure may vary by app/context |
| **BU Headcounts** | Computed | App-specific | Depends on app's BU definition |
| **Coverage Tracking** | Defined | App-specific | Champions tracker-specific metric |
| **Coverage Indicators** | Computed | App-specific | App-specific business logic |

## Implementation Questions

Before implementing, we need to clarify:

### 1. Division Heads

**Question:** Who are the division heads for each division?

**Need to identify:**
- Semiconductor Test division head email
- Robotics division head email
- Corporate/Operations division head email(s)

**Method:** Look at org hierarchy from CEO (gregory.smith@teradyne.com) and identify direct reports who lead divisions

### 2. Function Categories

**Question:** What are the standard function categories across the organization?

**Common functions seen in ai-champions-tracker:**
- Engineering - Software
- Engineering - Hardware
- Applications
- Product Management
- IT
- Marketing
- Sales
- Service

**Need to define:**
- Complete list of standard functions
- Job title patterns for each function
- How to handle ambiguous or unknown job titles

### 3. Business Unit Structure

**Question:** Is BU structure universal or app-specific?

**Considerations:**
- If universal → Define in org-data-sync-function
- If varies by app → Keep in each app
- Mixed approach → Define major BUs in shared service, allow apps to extend

### 4. Headcount Accuracy

**Question:** What explains the discrepancy?
- org-data-sync-function: 3,331 employees
- ai-champions-tracker: 8,037 employees

**Possibilities:**
- Static data is outdated
- Different employee scopes (full-time vs contractors vs all accounts)
- Different root users (CEO vs division heads)

**Need to verify:** What is the actual total employee count?

## Recommended Next Steps

1. **Analyze current org hierarchy from CDN**
   - Identify CEO's direct reports (likely division heads)
   - Review job title distribution to define function patterns
   - Understand actual org structure

2. **Define division classification**
   - Document division head emails
   - Add division mapping logic to org-data-sync-function
   - Test with sample employees

3. **Define function classification**
   - Create comprehensive job title → function mapping
   - Add function categorization to org-data-sync-function
   - Generate function breakdown in summary

4. **Update ai-champions-tracker**
   - Remove static orgHierarchy.json
   - Fetch org data from CDN
   - Define app-specific BU structure
   - Compute app-specific coverage metrics

5. **Validate**
   - Compare old vs new headcounts
   - Verify division/function classifications
   - Test champions tracker with new data source

## Open Questions

1. Should BU structure be in shared org-data-sync-function or app-specific?
2. What are the actual division head emails?
3. What is the complete list of function categories?
4. How should we handle employees with unclear classification (no job title, ambiguous department)?
5. Should we add "confidence scores" to classifications (e.g., 100% confident vs 50% confident)?

---

**Status:** Analysis complete, awaiting decisions before implementation
