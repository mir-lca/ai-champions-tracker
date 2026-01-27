---
created: 2026-01-24
type: analysis
jira: https://teradyne-robotics.atlassian.net/browse/AI-228
---

# Matrix Organization Structure - Corporate vs Divisional Functions

**Challenge:** Handle employees who report to divisions but have functional matrix relationships to corporate (e.g., divisional HR reporting to division president but matrixed to corporate CHRO).

## Organizational Patterns

### Pattern 1: Pure Corporate Functions
**Reports to:** C-suite (CEO direct reports)
**Examples:**
- Corporate HR (reports to CHRO)
- Corporate Finance (reports to CFO)
- Legal (reports to General Counsel)

**Characteristics:**
- Manager is C-suite executive
- Serves entire organization
- No division-specific reporting

### Pattern 2: Divisional Functions with Corporate Matrix
**Reports to:** Division president (primary)
**Matrix to:** Corporate function head (dotted line)

**Examples:**
- Division HR Manager → reports to Division President, matrixed to CHRO
- Division Finance → reports to Division President, matrixed to CFO

**Characteristics:**
- Primary reporting: Division
- Functional alignment: Corporate
- May have dual responsibilities

### Pattern 3: Pure Divisional Functions
**Reports to:** Division president or BU leader
**No matrix:** Independent from corporate

**Examples:**
- Division IT (in Robotics) → reports only to Robotics President
- BU-specific applications engineering

**Characteristics:**
- No corporate matrix relationship
- Division-specific scope
- Independent functional management

## Data Available from Microsoft Graph

**What we have:**
- ✅ `managerId` and `managerEmail` (direct manager only)
- ✅ Manager hierarchy (can traverse upward)
- ✅ Job titles

**What we DON'T have:**
- ❌ Matrix reporting relationships
- ❌ "Dotted line" managers
- ❌ Functional alignment metadata

**Limitation:** Microsoft Graph only provides **primary reporting line**, not matrix relationships.

## Recommended Approach

### Principle: Primary Reporting + Functional Classification

**Use primary reporting line for organizational structure:**
- Employee's division determined by primary manager hierarchy
- Headcount rolls up through primary reporting
- Organizational view shows where people actually report

**Use function classification for functional view:**
- Job title patterns determine function category
- Functional aggregations show all employees in each function
- Enables cross-divisional functional analysis

### Example: Divisional HR Manager

**Employee data:**
```json
{
  "displayName": "Jane Doe",
  "email": "jane.doe@teradyne.com",
  "jobTitle": "HR Manager, Semiconductor Test",
  "managerId": "shannon-poulin-guid",
  "managerEmail": "shannon.poulin@teradyne.com",
  "division": "Semiconductor Test",
  "divisionId": "semiconductor-test",
  "functionCategory": "HR",
  "reportingType": "divisional"  // NEW field suggestion
}
```

**Where counted:**
- **Organizational headcount:** Semiconductor Test division
- **Functional headcount:** HR function (across all divisions + corporate)

**Functional rollup shows:**
```json
{
  "functionSummary": [
    {
      "category": "HR",
      "totalHeadcount": 45,
      "breakdown": [
        {"type": "corporate", "headcount": 15, "reports_to": "CHRO"},
        {"type": "divisional", "divisionId": "semiconductor-test", "headcount": 10},
        {"type": "divisional", "divisionId": "robotics-ur", "headcount": 12},
        {"type": "divisional", "divisionId": "robotics-mir", "headcount": 8}
      ]
    }
  ]
}
```

## Implementation in org-data-sync-function

### 1. Identify Corporate vs Divisional

**Algorithm:**
```python
def classify_reporting_type(employee, division_heads, corporate_heads):
    """
    Determine if employee is corporate or divisional

    Corporate: Reports directly to C-suite
    Divisional: Reports through division president
    """
    # If manager is a corporate head (C-suite), this is corporate
    if employee['managerEmail'] in corporate_heads:
        return "corporate"

    # If manager is a division head
    if employee['managerEmail'] in division_heads.values():
        return "divisional"

    # Traverse upward - if we hit C-suite before division head, it's corporate
    # If we hit division head first, it's divisional
    current = employee
    max_depth = 20

    for _ in range(max_depth):
        if not current.get('managerEmail'):
            return "corporate"  # CEO level

        # Check if current manager is C-suite (corporate head)
        if current['managerEmail'] in corporate_heads:
            return "corporate"

        # Check if current manager is division head
        for div_id, div_head_email in division_heads.items():
            if current['managerEmail'] == div_head_email:
                return "divisional"

        # Move up
        current = find_manager(current['managerEmail'], all_employees)
        if not current:
            return "corporate"

    return "corporate"  # Fallback
```

**Configuration:**
```bash
# Environment variables
ORG_DIVISION_HEADS='{
  "semiconductor-test": "shannon.poulin@teradyne.com",
  "robotics-ur": "jpha@universal-robots.com",
  "robotics-mir": "walter.vahey@teradyne.com",
  "wireless-test": "brad.robbins@litepoint.com"
}'

ORG_CORPORATE_HEADS='[
  "michelle.turner@teradyne.com",
  "jim.mahon@teradyne.com",
  "ryan.driscoll@teradyne.com",
  "tim.moriarty@teradyne.com"
]'
```

### 2. Enhanced Employee Schema

```json
{
  "employees": [
    {
      "id": "guid",
      "email": "user@email.com",
      "displayName": "Name",
      "jobTitle": "Title",
      "division": "Semiconductor Test",
      "divisionId": "semiconductor-test",
      "divisionHeadEmail": "shannon.poulin@teradyne.com",
      "functionCategory": "HR",
      "reportingType": "divisional",  // NEW: "corporate" or "divisional"
      "managerId": "guid",
      "managerEmail": "manager@email.com"
    }
  ]
}
```

### 3. Enhanced Summary Structure

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
            "headcount": 450,
            "reportingType": "divisional"
          },
          {
            "category": "HR",
            "headcount": 10,
            "reportingType": "divisional"
          }
        ]
      }
    ],
    "corporate": [
      {
        "category": "HR",
        "headcount": 15,
        "corporateHeadEmail": "jim.mahon@teradyne.com",
        "reportingType": "corporate"
      },
      {
        "category": "Finance",
        "headcount": 35,
        "corporateHeadEmail": "michelle.turner@teradyne.com",
        "reportingType": "corporate"
      }
    ],
    "functionSummary": [
      {
        "category": "HR",
        "totalHeadcount": 45,
        "corporateHeadcount": 15,
        "divisionalHeadcount": 30,
        "breakdown": [
          {
            "type": "corporate",
            "headcount": 15,
            "leaderEmail": "jim.mahon@teradyne.com"
          },
          {
            "type": "divisional",
            "divisionId": "semiconductor-test",
            "divisionName": "Semiconductor Test",
            "headcount": 10
          },
          {
            "type": "divisional",
            "divisionId": "robotics-ur",
            "divisionName": "Universal Robots",
            "headcount": 12
          }
        ]
      }
    ]
  }
}
```

## Benefits of This Approach

### 1. Accurate Headcount
- Organizational view: Headcount rolls up through primary reporting
- No double-counting
- Clear where each employee belongs

### 2. Functional View
- Can see all HR across organization (corporate + divisional)
- Can see which divisions have HR functions
- Enables functional analysis and gap identification

### 3. Based on Available Data
- Uses actual Microsoft Graph data (manager hierarchy)
- No manual matrix relationship tracking needed
- Updates automatically when employees change managers

### 4. Supports Champions Coverage
- Corporate HR champion can see total HR headcount (corporate + all divisional)
- Divisional IT champion sees only their division's IT
- Clear scope definition for each champion

## Handling Matrix Relationships (Optional Enhancement)

If matrix relationships are critical, add **manual configuration**:

```json
// In ai-champions-tracker app configuration
const MATRIX_FUNCTIONS = {
  "HR": {
    corporateHead: "jim.mahon@teradyne.com",
    matrixScope: "all-divisions",  // Corporate HR has visibility to all divisional HR
    championCoverage: "corporate-plus-divisional"
  },
  "Finance": {
    corporateHead: "michelle.turner@teradyne.com",
    matrixScope: "all-divisions",
    championCoverage: "corporate-plus-divisional"
  },
  "IT": {
    matrixScope: "division-only",  // Divisional IT is independent
    championCoverage: "per-division"
  }
}
```

**Use for champions coverage:**
```javascript
function getChampionScope(champion, orgData, matrixConfig) {
  const functionConfig = matrixConfig[champion.focusArea];

  if (functionConfig?.championCoverage === "corporate-plus-divisional") {
    // Corporate HR champion covers corporate HR + all divisional HR
    return orgData.employees.filter(emp =>
      emp.functionCategory === champion.focusArea
    );
  } else {
    // Division-specific champion covers only their division
    return orgData.employees.filter(emp =>
      emp.functionCategory === champion.focusArea &&
      champion.businessUnits.includes(emp.businessUnitId)
    );
  }
}
```

## Examples

### Example 1: Corporate HR Champion

**Champion:** Chief People Officer
**Focus Area:** HR
**Coverage:** All HR (corporate + divisional)

**Covered employees:**
- Corporate HR (15 people reporting to CHRO)
- Semiconductor Test HR (10 people, primary report to division but function is HR)
- Robotics HR (20 people across UR and MiR)
- Total coverage: 45 people

**Data shows:**
```json
{
  "functionSummary": [
    {
      "category": "HR",
      "totalHeadcount": 45,
      "corporateHeadcount": 15,
      "divisionalHeadcount": 30
    }
  ]
}
```

### Example 2: Divisional IT Champion

**Champion:** Robotics IT Manager
**Focus Area:** IT
**Coverage:** Robotics division only

**Covered employees:**
- Robotics IT (21 people, report to Robotics division)
- Does NOT cover corporate IT or other division IT

**Data shows:**
```json
{
  "divisions": [
    {
      "id": "robotics",
      "functions": [
        {
          "category": "IT",
          "headcount": 21,
          "reportingType": "divisional"
        }
      ]
    }
  ]
}
```

### Example 3: Mixed - Engineering Software Champion

**Champion:** Stephen Hlotyak
**Focus Area:** Engineering - Software
**Coverage:** CTD business unit only (not all semiconductor test)

**Covered employees:**
- CTD Software Engineering (405 people)
- Does NOT cover other BUs within Semiconductor Test

**This requires BU-level filtering (app-specific):**
```javascript
const coveredEmployees = orgData.employees.filter(emp =>
  emp.functionCategory === "Engineering - Software" &&
  emp.businessUnitId === "ctd"  // BU mapping done in app
);
```

## Decision Matrix

| Scenario | Headcount Counted In | Function Aggregation | Champion Coverage |
|----------|---------------------|---------------------|-------------------|
| **Corporate HR** | Corporate | HR (corporate) | Corp HR champion |
| **Divisional HR** | Division | HR (divisional) | Corp HR champion* OR Division champion |
| **Divisional IT (independent)** | Division | IT (divisional) | Division champion only |
| **BU Software Engineering** | Division > BU | Engineering - Software | BU-specific champion |

\* Depends on matrix configuration and champion scope

## Recommendations for org-data-sync-function

### Add These Fields

1. **`reportingType`** - "corporate" or "divisional"
   - Determined by primary manager hierarchy
   - Shows organizational reporting structure

2. **`corporateHeadEmail`** - For corporate functions
   - Email of C-suite leader (CHRO, CFO, etc.)
   - Null for divisional employees

3. **`functionSummary`** - In summary object
   - Roll up of each function across entire org
   - Shows corporate vs divisional breakdown
   - Enables functional view

### Do NOT Add

❌ Matrix reporting relationships (not available in Microsoft Graph)
❌ Dotted line managers (requires manual maintenance)
❌ Functional authority hierarchy (too complex, app-specific)

## Recommendations for ai-champions-tracker

### Define Matrix Scope in App

**Configuration file:**
```javascript
// src/config/functionScopes.js
export const FUNCTION_SCOPES = {
  "HR": {
    matrixScope: "corporate-plus-divisional",
    corporateHead: "jim.mahon@teradyne.com",
    description: "Corporate HR champion covers all HR across organization"
  },
  "Finance": {
    matrixScope: "corporate-plus-divisional",
    corporateHead: "michelle.turner@teradyne.com"
  },
  "IT": {
    matrixScope: "per-division",
    description: "IT is managed independently by each division"
  },
  "Marketing": {
    matrixScope: "per-division"
  },
  "Sales": {
    matrixScope: "per-division"
  },
  "Engineering - Software": {
    matrixScope: "per-bu",
    description: "Software engineering champions are BU-specific"
  },
  "Engineering - Hardware": {
    matrixScope: "per-bu"
  }
};
```

### Compute Coverage Based on Scope

```javascript
function computeChampionCoverage(champion, orgData, functionScopes) {
  const scopeConfig = functionScopes[champion.focusArea];

  if (!scopeConfig) {
    // Default: per-BU scope
    return orgData.employees.filter(emp =>
      emp.functionCategory === champion.focusArea &&
      champion.businessUnits.some(bu => emp.businessUnitId === bu)
    );
  }

  switch (scopeConfig.matrixScope) {
    case "corporate-plus-divisional":
      // Champion covers all employees in this function
      return orgData.employees.filter(emp =>
        emp.functionCategory === champion.focusArea
      );

    case "per-division":
      // Champion covers only their division
      return orgData.employees.filter(emp =>
        emp.functionCategory === champion.focusArea &&
        champion.divisions.includes(emp.divisionId)
      );

    case "per-bu":
      // Champion covers only their BUs
      return orgData.employees.filter(emp =>
        emp.functionCategory === champion.focusArea &&
        champion.businessUnits.some(bu => emp.businessUnitId === bu)
      );

    default:
      return [];
  }
}
```

## Summary

### Shared Service (org-data-sync-function)

**Add:**
- ✅ `reportingType` field (corporate vs divisional)
- ✅ `functionSummary` in summary (functional rollup)
- ✅ Corporate vs divisional breakdown in summary

**Based on:**
- Primary manager hierarchy (available from Microsoft Graph)
- Job title patterns (for function classification)
- Configuration of division/corporate heads

### App-Specific (ai-champions-tracker)

**Add:**
- ⚠️ Matrix scope configuration (FUNCTION_SCOPES)
- ⚠️ Champion coverage computation based on scope
- ⚠️ UI to show corporate vs divisional functions

**Based on:**
- Business logic about matrix relationships
- Champion assignment rules
- Gap analysis requirements

## Confirmed Configuration

### Matrix Scope by Function

| Function | Matrix Scope | Description |
|----------|-------------|-------------|
| **HR** | `corporate` | Corporate HR covers all HR across organization |
| **Finance** | `corporate-plus-divisional` | Corporate Finance covers all finance |
| **IT** | `corporate-plus-divisional` | Corporate IT covers all IT |
| **Legal** | `corporate` | Corporate Legal covers all legal |
| **Marketing** | `per-division` | Each division has independent marketing |
| **Sales** | `per-division` | Each division has independent sales |
| **Engineering - Software** | `per-bu` | BU-specific engineering teams |
| **Engineering - Hardware** | `per-bu` | BU-specific engineering teams |

### C-Suite Leaders (All CEO Direct Reports)

**Corporate Function Heads:**
- Jim Mahon (jim.mahon@teradyne.com) - Chief Human Resources Officer
- Michelle Turner (michelle.turner@teradyne.com) - VP, Chief Financial Officer
- Ryan Driscoll (ryan.driscoll@teradyne.com) - VP, General Counsel & Secretary
- Tim Moriarty (tim.moriarty@teradyne.com) - Executive VP, Corporate Development
- Amy McAndrews (amy.mcandrews@teradyne.com) - VP, Corporate Development
- Sanjay Mehta (sanjay.mehta@teradyne.com) - VP, Executive Advisor to Operations

**Division Presidents:**
- Shannon Poulin (shannon.poulin@teradyne.com) - President, Semiconductor Test Group
- Regan Mills (regan.mills@teradyne.com) - President, Product Test Division
- Jean-Pierre Hathout (jpha@universal-robots.com) - Div President - Robotics (UR)
- Walter Vahey (walter.vahey@teradyne.com) - President, Mobile Industrial Robots (MiR)
- Brad Robbins (brad.robbins@litepoint.com) - President, LitePoint

**Other:**
- Eric Truebenbach (eric.truebenbach@teradyne.com) - Managing Director, Teradyne Robotics Ventures
- Traci Tsuchiguchi (traci.tsuchiguchi@teradyne.com) - Corporate Relations
- Ujjwal Kumar (ujjwal.kumar@teradyne.com) - Div President - Robotics

## Classification Logic

### reportingType Determination

```python
# Corporate function heads (not division presidents)
CORPORATE_FUNCTION_HEADS = [
    "jim.mahon@teradyne.com",          # CHRO
    "michelle.turner@teradyne.com",     # CFO
    "ryan.driscoll@teradyne.com",       # General Counsel
    "tim.moriarty@teradyne.com",        # Corp Dev
    "amy.mcandrews@teradyne.com",       # Corp Dev
    "sanjay.mehta@teradyne.com",        # Advisor to Ops
    "eric.truebenbach@teradyne.com",    # Robotics Ventures
    "traci.tsuchiguchi@teradyne.com"    # Corporate Relations
]

# Division presidents
DIVISION_HEADS = {
    "semiconductor-test": "shannon.poulin@teradyne.com",
    "product-test": "regan.mills@teradyne.com",
    "robotics-ur": "jpha@universal-robots.com",
    "robotics-mir": "walter.vahey@teradyne.com",
    "wireless-test": "brad.robbins@litepoint.com"
}

def classify_reporting_type(employee, all_employees):
    """
    Corporate: Reports through corporate function head
    Divisional: Reports through division president
    """
    # Traverse manager chain
    current = employee

    while current.get('managerEmail'):
        # If we hit a corporate function head, it's corporate
        if current['managerEmail'] in CORPORATE_FUNCTION_HEADS:
            return "corporate"

        # If we hit a division head, it's divisional
        if current['managerEmail'] in DIVISION_HEADS.values():
            return "divisional"

        # Move up to manager
        current = find_manager(current['managerEmail'], all_employees)
        if not current:
            break

    return "corporate"  # CEO level or fallback
```

## Next Steps

1. ✅ Confirmed matrix scope configuration
2. ✅ Identified all C-suite leaders
3. **NEXT:** Implement `reportingType` classification in org-data-sync-function
4. **NEXT:** Add `functionSummary` to summary object
5. **NEXT:** Update ai-champions-tracker with matrix scope configuration

---

**Status:** ✅ Configuration confirmed, ready for implementation
