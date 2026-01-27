---
created: 2026-01-24
type: implementation-plan
jira: https://teradyne-robotics.atlassian.net/browse/AI-228
---

# Implementation Plan: Enhanced Organizational Data Structure

**Goal:** Enhance org-data-sync-function to provide accurate division/function classification and enable ai-champions-tracker to match actual organization structure.

**Key Changes:**
1. Add division classification (manager hierarchy-based)
2. Add function classification (job title pattern-based)
3. Add reporting type classification (corporate vs divisional)
4. Generate enhanced summary with functional rollups
5. Update ai-champions-tracker to consume enhanced CDN data

## Phase 1: Enhance org-data-sync-function

### Step 1.1: Add Configuration

**File:** `local.settings.json` (and Azure Function app settings)

**Add these environment variables:**

```json
{
  "Values": {
    "AZURE_TENANT_ID": "eae846e4-996d-4b47-83b9-5f5937d358fe",
    "AZURE_CLIENT_ID": "c05a649d-95b5-4dd7-a1ff-f48e274538e9",
    "AZURE_CLIENT_SECRET": "...",
    "AZURE_STORAGE_CONNECTION_STRING": "...",
    "ORG_ROOT_USERS": "gregory.smith@teradyne.com",
    "ORG_DIVISION_HEADS": "{\"semiconductor-test\": \"shannon.poulin@teradyne.com\", \"product-test\": \"regan.mills@teradyne.com\", \"robotics-ur\": \"jpha@universal-robots.com\", \"robotics-mir\": \"walter.vahey@teradyne.com\", \"wireless-test\": \"brad.robbins@litepoint.com\"}",
    "ORG_CORPORATE_HEADS": "[\"jim.mahon@teradyne.com\", \"michelle.turner@teradyne.com\", \"ryan.driscoll@teradyne.com\", \"tim.moriarty@teradyne.com\", \"amy.mcandrews@teradyne.com\", \"sanjay.mehta@teradyne.com\", \"eric.truebenbach@teradyne.com\", \"traci.tsuchiguchi@teradyne.com\"]"
  }
}
```

**Division Heads Mapping:**
- `"semiconductor-test"` → shannon.poulin@teradyne.com
- `"product-test"` → regan.mills@teradyne.com (may overlap with semiconductor-test)
- `"robotics-ur"` → jpha@universal-robots.com
- `"robotics-mir"` → walter.vahey@teradyne.com
- `"wireless-test"` → brad.robbins@litepoint.com

**Corporate Function Heads:**
- jim.mahon@teradyne.com (CHRO)
- michelle.turner@teradyne.com (CFO)
- ryan.driscoll@teradyne.com (General Counsel)
- tim.moriarty@teradyne.com (Corporate Development)
- amy.mcandrews@teradyne.com (Corporate Development)
- sanjay.mehta@teradyne.com (Executive Advisor to Operations)
- eric.truebenbach@teradyne.com (Robotics Ventures)
- traci.tsuchiguchi@teradyne.com (Corporate Relations)

### Step 1.2: Create Classification Module

**File:** `org_classifiers.py` (new file)

```python
"""
Organization classification logic for divisions, functions, and reporting types
"""

import os
import json
import re
import logging
from typing import Dict, List, Any, Optional


def load_config():
    """Load division and corporate head configuration from environment"""
    division_heads = json.loads(os.environ.get("ORG_DIVISION_HEADS", "{}"))
    corporate_heads = json.loads(os.environ.get("ORG_CORPORATE_HEADS", "[]"))
    return division_heads, corporate_heads


# Function classification patterns
FUNCTION_PATTERNS = {
    "Engineering - Software": [
        r"software engineer",
        r"sw engineer",
        r"software developer",
        r"software architect",
        r"senior software",
        r"principal software",
        r"staff software",
        r"lead software"
    ],
    "Engineering - Hardware": [
        r"hardware engineer",
        r"hw engineer",
        r"electrical engineer",
        r"mechanical engineer",
        r"senior hardware",
        r"principal hardware",
        r"design engineer"
    ],
    "Engineering - Applications": [
        r"applications? engineer",
        r"field application",
        r"fae",
        r"applications specialist"
    ],
    "Product Management": [
        r"product manager",
        r"program manager",
        r"product marketing manager",
        r"senior product",
        r"principal product"
    ],
    "IT": [
        r"\bIT\b",
        r"information technology",
        r"system administrator",
        r"network engineer",
        r"IT manager",
        r"IT director"
    ],
    "Marketing": [
        r"marketing",
        r"^marcom",
        r"communications",
        r"brand manager",
        r"marketing manager"
    ],
    "Sales": [
        r"sales",
        r"account manager",
        r"business development",
        r"sales engineer",
        r"regional sales"
    ],
    "HR": [
        r"\bHR\b",
        r"human resources",
        r"talent acquisition",
        r"recruiter",
        r"people operations"
    ],
    "Finance": [
        r"finance",
        r"financial analyst",
        r"controller",
        r"accounting",
        r"treasury"
    ],
    "Legal": [
        r"legal",
        r"counsel",
        r"attorney",
        r"paralegal"
    ],
    "Operations": [
        r"operations",
        r"supply chain",
        r"manufacturing",
        r"quality",
        r"process engineer"
    ]
}


def classify_function(job_title: Optional[str]) -> str:
    """
    Classify employee function based on job title patterns

    Args:
        job_title: Employee job title

    Returns:
        Function category name or "Other"
    """
    if not job_title:
        return "Other"

    title_lower = job_title.lower()

    for function_name, patterns in FUNCTION_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, title_lower, re.IGNORECASE):
                return function_name

    return "Other"


def find_employee_by_email(email: str, all_employees: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find employee record by email"""
    return next((emp for emp in all_employees if emp.get('email') == email), None)


def classify_division(
    employee: Dict[str, Any],
    all_employees: List[Dict[str, Any]],
    division_heads: Dict[str, str]
) -> tuple[str, str, Optional[str]]:
    """
    Classify employee's division by traversing manager hierarchy

    Args:
        employee: Employee record
        all_employees: All employee records
        division_heads: Mapping of division_id -> division_head_email

    Returns:
        Tuple of (division_name, division_id, division_head_email)
    """
    current = employee
    max_depth = 20

    for _ in range(max_depth):
        if not current.get('managerEmail'):
            # Reached CEO or top level
            return "Corporate", "corporate", None

        # Check if current manager is a division head
        for div_id, div_head_email in division_heads.items():
            if current['managerEmail'] == div_head_email:
                # This employee reports to this division
                division_name = format_division_name(div_id)
                return division_name, div_id, div_head_email

        # Check if current employee IS a division head
        for div_id, div_head_email in division_heads.items():
            if current['email'] == div_head_email:
                # This is the division head themselves
                division_name = format_division_name(div_id)
                return division_name, div_id, div_head_email

        # Move up to manager
        manager = find_employee_by_email(current['managerEmail'], all_employees)
        if not manager:
            return "Corporate", "corporate", None

        current = manager

    return "Corporate", "corporate", None


def format_division_name(division_id: str) -> str:
    """Convert division ID to display name"""
    name_map = {
        "semiconductor-test": "Semiconductor Test",
        "product-test": "Product Test",
        "robotics-ur": "Robotics - UR",
        "robotics-mir": "Robotics - MiR",
        "wireless-test": "Wireless Test",
        "corporate": "Corporate"
    }
    return name_map.get(division_id, division_id.replace("-", " ").title())


def classify_reporting_type(
    employee: Dict[str, Any],
    all_employees: List[Dict[str, Any]],
    corporate_heads: List[str],
    division_heads: Dict[str, str]
) -> str:
    """
    Classify whether employee is corporate or divisional reporting

    Args:
        employee: Employee record
        all_employees: All employee records
        corporate_heads: List of corporate function head emails
        division_heads: Mapping of division_id -> division_head_email

    Returns:
        "corporate" or "divisional"
    """
    current = employee
    max_depth = 20

    for _ in range(max_depth):
        if not current.get('managerEmail'):
            # CEO level
            return "corporate"

        # If manager is a corporate function head
        if current['managerEmail'] in corporate_heads:
            return "corporate"

        # If manager is a division head
        if current['managerEmail'] in division_heads.values():
            return "divisional"

        # Move up to manager
        manager = find_employee_by_email(current['managerEmail'], all_employees)
        if not manager:
            return "corporate"

        current = manager

    return "corporate"


def enrich_employee_data(
    employees: List[Dict[str, Any]],
    division_heads: Dict[str, str],
    corporate_heads: List[str]
) -> List[Dict[str, Any]]:
    """
    Enrich employee data with division, function, and reporting type classifications

    Args:
        employees: List of employee records
        division_heads: Mapping of division_id -> division_head_email
        corporate_heads: List of corporate function head emails

    Returns:
        Enriched employee records
    """
    logging.info(f"Enriching {len(employees)} employee records with classifications")

    enriched = []

    for emp in employees:
        # Classify division
        division_name, division_id, division_head_email = classify_division(
            emp, employees, division_heads
        )

        # Classify function
        function_category = classify_function(emp.get('jobTitle'))

        # Classify reporting type
        reporting_type = classify_reporting_type(
            emp, employees, corporate_heads, division_heads
        )

        # Add enriched fields
        enriched_emp = {
            **emp,
            'division': division_name,
            'divisionId': division_id,
            'divisionHeadEmail': division_head_email,
            'functionCategory': function_category,
            'reportingType': reporting_type
        }

        enriched.append(enriched_emp)

    logging.info(f"✅ Enriched all employee records")
    return enriched


def generate_summary(employees: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate summary statistics with division and function breakdowns

    Args:
        employees: Enriched employee records

    Returns:
        Summary object with divisions, corporate, and functionSummary
    """
    logging.info("Generating enhanced summary statistics")

    # Group by division
    divisions_map = {}
    corporate_functions = {}
    function_totals = {}

    for emp in employees:
        div_id = emp.get('divisionId', 'corporate')
        func_cat = emp.get('functionCategory', 'Other')
        rep_type = emp.get('reportingType', 'corporate')

        # Track by division
        if div_id != 'corporate':
            if div_id not in divisions_map:
                divisions_map[div_id] = {
                    'id': div_id,
                    'name': emp.get('division', div_id),
                    'headcount': 0,
                    'divisionHeadEmail': emp.get('divisionHeadEmail'),
                    'functions': {}
                }

            divisions_map[div_id]['headcount'] += 1

            # Track functions within division
            if func_cat not in divisions_map[div_id]['functions']:
                divisions_map[div_id]['functions'][func_cat] = {
                    'category': func_cat,
                    'headcount': 0,
                    'reportingType': rep_type
                }
            divisions_map[div_id]['functions'][func_cat]['headcount'] += 1

        # Track corporate functions
        if rep_type == 'corporate':
            if func_cat not in corporate_functions:
                corporate_functions[func_cat] = {
                    'category': func_cat,
                    'headcount': 0,
                    'reportingType': 'corporate'
                }
            corporate_functions[func_cat]['headcount'] += 1

        # Track function totals
        if func_cat not in function_totals:
            function_totals[func_cat] = {
                'category': func_cat,
                'totalHeadcount': 0,
                'corporateHeadcount': 0,
                'divisionalHeadcount': 0,
                'breakdown': {}
            }

        function_totals[func_cat]['totalHeadcount'] += 1

        if rep_type == 'corporate':
            function_totals[func_cat]['corporateHeadcount'] += 1
        else:
            function_totals[func_cat]['divisionalHeadcount'] += 1

        # Track breakdown by division/corporate
        breakdown_key = f"{rep_type}:{div_id}"
        if breakdown_key not in function_totals[func_cat]['breakdown']:
            function_totals[func_cat]['breakdown'][breakdown_key] = {
                'type': rep_type,
                'divisionId': div_id if div_id != 'corporate' else None,
                'divisionName': emp.get('division') if div_id != 'corporate' else None,
                'headcount': 0
            }
        function_totals[func_cat]['breakdown'][breakdown_key]['headcount'] += 1

    # Format divisions list
    divisions = []
    for div_data in divisions_map.values():
        # Convert functions dict to list
        functions_list = list(div_data['functions'].values())
        div_data['functions'] = functions_list
        divisions.append(div_data)

    # Sort divisions by headcount
    divisions.sort(key=lambda x: x['headcount'], reverse=True)

    # Format corporate functions list
    corporate = list(corporate_functions.values())
    corporate.sort(key=lambda x: x['headcount'], reverse=True)

    # Format function summary
    function_summary = []
    for func_data in function_totals.values():
        # Convert breakdown dict to list
        breakdown_list = list(func_data['breakdown'].values())
        func_data['breakdown'] = breakdown_list
        function_summary.append(func_data)

    # Sort by total headcount
    function_summary.sort(key=lambda x: x['totalHeadcount'], reverse=True)

    summary = {
        'divisions': divisions,
        'corporate': corporate,
        'functionSummary': function_summary
    }

    logging.info(f"✅ Generated summary: {len(divisions)} divisions, {len(corporate)} corporate functions, {len(function_summary)} total functions")

    return summary
```

### Step 1.3: Update generate_org_hierarchy.py

**File:** `generate_org_hierarchy.py`

**Add imports:**
```python
from org_classifiers import (
    load_config,
    enrich_employee_data,
    generate_summary
)
```

**Update `generate_org_hierarchy_json` function:**

```python
def generate_org_hierarchy_json(org_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Transform Microsoft Graph data into standardized org-hierarchy.json with enhanced classifications

    Schema:
    {
      "version": "ISO timestamp",
      "totalEmployees": int,
      "employees": [employee objects with enhanced fields],
      "summary": {
        "divisions": [...],
        "corporate": [...],
        "functionSummary": [...]
      }
    }
    """
    logging.info("Generating enhanced org-hierarchy.json from Microsoft Graph data")

    # Flatten the tree structure to a list of all users with manager info
    all_employees = []
    for tree in org_data:
        flatten_users_with_managers(tree, all_employees, manager_id=None, manager_email=None)

    logging.info(f"Processing {len(all_employees)} total employees")

    # Load classification configuration
    division_heads, corporate_heads = load_config()
    logging.info(f"Loaded config: {len(division_heads)} divisions, {len(corporate_heads)} corporate heads")

    # Enrich employee data with classifications
    enriched_employees = enrich_employee_data(all_employees, division_heads, corporate_heads)

    # Generate enhanced summary with functional rollups
    summary = generate_summary(enriched_employees)

    # Build final structure
    org_hierarchy = {
        "version": datetime.now(timezone.utc).isoformat(),
        "totalEmployees": len(enriched_employees),
        "employees": enriched_employees,
        "summary": summary
    }

    logging.info(f"✅ Generated org-hierarchy.json with {len(enriched_employees)} employees and enhanced summary")

    return org_hierarchy
```

### Step 1.4: Test Locally

```bash
cd /Users/mirlca/Library/CloudStorage/OneDrive-Teradyne/Documents/Notes/05-shared/org-data-sync-function

# Run test script
python test_locally.py
```

**Expected output:**
- Employee records with new fields: `divisionId`, `divisionHeadEmail`, `functionCategory`, `reportingType`
- Summary with `divisions`, `corporate`, and `functionSummary` arrays
- Verify division classifications look correct
- Check function classifications (should have <20% "Other")

### Step 1.5: Deploy to Azure

```bash
# Commit changes
git add .
git commit -m "Add division, function, and reporting type classifications

- Add org_classifiers.py with classification logic
- Update generate_org_hierarchy.py to enrich employee data
- Add ORG_DIVISION_HEADS and ORG_CORPORATE_HEADS env vars
- Generate enhanced summary with functional rollups"

git push origin main

# Update Azure Function app settings
az functionapp config appsettings set \
  --name org-data-sync-func-lca \
  --resource-group cursor-adoption-rg \
  --settings \
    ORG_DIVISION_HEADS='{"semiconductor-test": "shannon.poulin@teradyne.com", "product-test": "regan.mills@teradyne.com", "robotics-ur": "jpha@universal-robots.com", "robotics-mir": "walter.vahey@teradyne.com", "wireless-test": "brad.robbins@litepoint.com"}' \
    ORG_CORPORATE_HEADS='["jim.mahon@teradyne.com", "michelle.turner@teradyne.com", "ryan.driscoll@teradyne.com", "tim.moriarty@teradyne.com", "amy.mcandrews@teradyne.com", "sanjay.mehta@teradyne.com", "eric.truebenbach@teradyne.com", "traci.tsuchiguchi@teradyne.com"]'

# Wait for GitHub Actions deployment to complete
gh run watch

# Trigger manual sync
python manual_sync_now.py
```

### Step 1.6: Verify CDN Data

```bash
# Fetch and validate structure
curl -s "https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json" | jq '{
  version: .version,
  totalEmployees: .totalEmployees,
  sampleEmployee: .employees[0],
  summaryKeys: .summary | keys,
  divisionCount: .summary.divisions | length,
  functionSummaryCount: .summary.functionSummary | length
}'
```

**Expected:**
- `sampleEmployee` has new fields: `divisionId`, `functionCategory`, `reportingType`
- `summary` has keys: `["corporate", "divisions", "functionSummary"]`
- `divisionCount`: ~4-5 divisions
- `functionSummaryCount`: ~10-12 functions

## Phase 2: Update ai-champions-tracker

### Step 2.1: Create Org Data Client

**File:** `frontend/src/api/orgDataClient.js` (new file)

```javascript
import { useQuery } from '@tanstack/react-query';

const ORG_DATA_CDN_URL = 'https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json';

/**
 * Fetch organizational data from CDN
 * Uses React Query for caching (5 min stale time matches CDN cache)
 */
export const useOrgData = () => {
  return useQuery({
    queryKey: ['orgData'],
    queryFn: async () => {
      const response = await fetch(ORG_DATA_CDN_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch org data: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes (matches CDN cache)
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    retryDelay: 1000
  });
};
```

### Step 2.2: Define BU Structure and Matrix Scopes

**File:** `frontend/src/config/orgStructure.js` (new file)

```javascript
/**
 * Business Unit structure by division
 * BUs are not reliably available from Microsoft Graph, so we define them here
 */
export const BUSINESS_UNITS = {
  "semiconductor-test": [
    {
      id: "ctd",
      name: "Compute Test (CTD)",
      emailDomains: [],
      keywords: ["ctd", "ultraflex", "compute"]
    },
    {
      id: "systems-test",
      name: "Systems Test",
      keywords: ["systems", "j750"]
    },
    {
      id: "memory-test",
      name: "Memory Test",
      keywords: ["memory"]
    },
    {
      id: "production-board-test",
      name: "Production Board Test",
      keywords: ["board test", "production board"]
    },
    {
      id: "wireless-test",
      name: "Wireless Test",
      keywords: ["wireless"]
    }
  ],
  "robotics-ur": [
    {
      id: "ur",
      name: "Universal Robots (UR)",
      emailDomains: ["universal-robots.com"]
    }
  ],
  "robotics-mir": [
    {
      id: "mir",
      name: "Mobile Industrial Robots (MiR)",
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

/**
 * Matrix scope configuration by function
 * Defines how champions for each function should calculate their coverage
 */
export const FUNCTION_SCOPES = {
  "HR": {
    matrixScope: "corporate",
    description: "Corporate HR champion covers all HR across organization"
  },
  "Finance": {
    matrixScope: "corporate-plus-divisional",
    description: "Corporate Finance champion covers all finance"
  },
  "IT": {
    matrixScope: "corporate-plus-divisional",
    description: "Corporate IT champion covers all IT"
  },
  "Legal": {
    matrixScope: "corporate",
    description: "Corporate Legal covers all legal"
  },
  "Marketing": {
    matrixScope: "per-division",
    description: "Marketing is managed independently by each division"
  },
  "Sales": {
    matrixScope: "per-division",
    description: "Sales is managed independently by each division"
  },
  "Engineering - Software": {
    matrixScope: "per-bu",
    description: "Software engineering champions are BU-specific"
  },
  "Engineering - Hardware": {
    matrixScope: "per-bu",
    description: "Hardware engineering champions are BU-specific"
  },
  "Engineering - Applications": {
    matrixScope: "per-bu",
    description: "Applications engineering champions are BU-specific"
  },
  "Product Management": {
    matrixScope: "per-bu",
    description: "Product management is BU-specific"
  }
};
```

### Step 2.3: Create BU Mapping Utility

**File:** `frontend/src/utils/mapBusinessUnits.js` (new file)

```javascript
import { BUSINESS_UNITS } from '../config/orgStructure';

/**
 * Map employees to business units based on division and heuristics
 */
export function mapEmployeeToBU(employee, allEmployees) {
  const divisionBUs = BUSINESS_UNITS[employee.divisionId];

  if (!divisionBUs || divisionBUs.length === 0) {
    return null;
  }

  // If only one BU in division, assign to that BU
  if (divisionBUs.length === 1) {
    return divisionBUs[0].id;
  }

  // Try email domain match
  for (const bu of divisionBUs) {
    if (bu.emailDomains?.length > 0) {
      for (const domain of bu.emailDomains) {
        if (employee.email?.endsWith(`@${domain}`)) {
          return bu.id;
        }
      }
    }
  }

  // Try keyword match in job title
  const jobTitle = employee.jobTitle?.toLowerCase() || '';
  for (const bu of divisionBUs) {
    if (bu.keywords?.length > 0) {
      for (const keyword of bu.keywords) {
        if (jobTitle.includes(keyword.toLowerCase())) {
          return bu.id;
        }
      }
    }
  }

  // Try manager hierarchy (if BU has leader defined)
  for (const bu of divisionBUs) {
    if (bu.leaders?.length > 0) {
      if (isUnderManager(employee, bu.leaders, allEmployees)) {
        return bu.id;
      }
    }
  }

  // Default: use division as BU (for divisions like UR, MiR)
  return divisionBUs[0].id;
}

/**
 * Check if employee reports to any of the specified managers
 */
function isUnderManager(employee, managerEmails, allEmployees, maxDepth = 10) {
  let current = employee;

  for (let i = 0; i < maxDepth; i++) {
    if (!current.managerEmail) {
      return false;
    }

    if (managerEmails.includes(current.managerEmail)) {
      return true;
    }

    // Find manager
    current = allEmployees.find(emp => emp.email === current.managerEmail);
    if (!current) {
      return false;
    }
  }

  return false;
}

/**
 * Enrich all employees with businessUnitId
 */
export function enrichWithBusinessUnits(orgData) {
  const employeesWithBUs = orgData.employees.map(emp => ({
    ...emp,
    businessUnitId: mapEmployeeToBU(emp, orgData.employees)
  }));

  return {
    ...orgData,
    employees: employeesWithBUs
  };
}
```

### Step 2.4: Create Coverage Computation Utility

**File:** `frontend/src/utils/computeCoverage.js` (new file)

```javascript
import { FUNCTION_SCOPES } from '../config/orgStructure';

/**
 * Compute champion coverage based on matrix scope configuration
 */
export function computeChampionCoverage(champion, orgData) {
  const scopeConfig = FUNCTION_SCOPES[champion.focusArea];

  if (!scopeConfig) {
    // Default: per-BU scope
    return computePerBUCoverage(champion, orgData);
  }

  switch (scopeConfig.matrixScope) {
    case "corporate":
    case "corporate-plus-divisional":
      // Champion covers all employees in this function across entire org
      return orgData.employees.filter(emp =>
        emp.functionCategory === champion.focusArea
      );

    case "per-division":
      // Champion covers only their division(s)
      return orgData.employees.filter(emp =>
        emp.functionCategory === champion.focusArea &&
        champion.divisions?.includes(emp.divisionId)
      );

    case "per-bu":
      // Champion covers only their BU(s)
      return computePerBUCoverage(champion, orgData);

    default:
      return [];
  }
}

function computePerBUCoverage(champion, orgData) {
  return orgData.employees.filter(emp =>
    emp.functionCategory === champion.focusArea &&
    champion.businessUnits?.some(bu => emp.businessUnitId === bu)
  );
}

/**
 * Compute overall coverage statistics
 */
export function computeCoverageStats(orgData, championsData) {
  const coverage = {};  // employeeId -> championId

  for (const champion of championsData.champions) {
    const coveredEmployees = computeChampionCoverage(champion, orgData);

    for (const emp of coveredEmployees) {
      // Track coverage (may have multiple champions per employee for matrix functions)
      if (!coverage[emp.id]) {
        coverage[emp.id] = [];
      }
      coverage[emp.id].push(champion.id);
    }
  }

  const totalEmployees = orgData.totalEmployees;
  const coveredEmployees = Object.keys(coverage).length;
  const coveragePercentage = ((coveredEmployees / totalEmployees) * 100).toFixed(1);

  return {
    totalEmployees,
    coveredEmployees,
    coveragePercentage: parseFloat(coveragePercentage),
    coverage,
    confirmedChampions: championsData.champions.filter(c => c.status === 'confirmed').length,
    totalChampions: championsData.champions.length
  };
}
```

### Step 2.5: Update App.jsx to Use New Data

**File:** `frontend/src/App.jsx`

```javascript
import { useOrgData } from './api/orgDataClient';
import { enrichWithBusinessUnits } from './utils/mapBusinessUnits';
import { computeCoverageStats } from './utils/computeCoverage';
import championsData from './data/championsData.json';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch org data from CDN
  const { data: orgData, isLoading, error } = useOrgData();

  if (isLoading) {
    return <div className="loading">Loading organizational data...</div>;
  }

  if (error) {
    return <div className="error">Error loading data: {error.message}</div>;
  }

  // Enrich with BU mappings
  const enrichedOrgData = enrichWithBusinessUnits(orgData);

  // Compute coverage statistics
  const coverageStats = computeCoverageStats(enrichedOrgData, championsData);

  return (
    <div className="app">
      {/* Tab navigation */}
      {/* Pass enrichedOrgData and coverageStats to components */}
    </div>
  );
}
```

### Step 2.6: Update Champions Data Structure

**File:** `frontend/src/data/championsData.json`

Update champion records to use `divisionId` and align with new structure:

```json
{
  "champions": [
    {
      "id": "champion-001",
      "name": "Stephen Hlotyak",
      "email": "stephen.hlotyak@teradyne.com",
      "divisions": ["semiconductor-test"],
      "businessUnits": ["ctd"],
      "focusArea": "Engineering - Software",
      "status": "confirmed",
      "appointmentDate": "2026-01-21"
    },
    {
      "id": "champion-002",
      "name": "Jacob Pilegaard",
      "email": "japi@universal-robots.com",
      "divisions": ["robotics-ur", "robotics-mir"],
      "businessUnits": ["ur", "mir"],
      "focusArea": "Engineering - Software",
      "status": "confirmed",
      "appointmentDate": "2026-01-21"
    },
    {
      "id": "champion-003",
      "name": "Martin Nordentoft",
      "email": "martin.nordentoft@teradyne-robotics.com",
      "divisions": ["robotics-ur", "robotics-mir"],
      "businessUnits": ["ur", "mir"],
      "focusArea": "IT",
      "status": "confirmed",
      "appointmentDate": "2026-01-21"
    }
  ]
}
```

### Step 2.7: Remove Static Org Hierarchy

```bash
# Delete old static file
rm frontend/src/data/orgHierarchy.json
rm frontend/src/utils/getDivisionSummary.js

# Commit changes
git add .
git commit -m "Replace static org data with CDN fetch

- Add orgDataClient with React Query integration
- Define BU structure and matrix scopes
- Add BU mapping and coverage computation utilities
- Update App.jsx to fetch from CDN
- Remove static orgHierarchy.json"

git push origin main
```

### Step 2.8: Test Locally

```bash
cd frontend
npm run dev
```

**Verify:**
- App loads org data from CDN
- Coverage percentages update based on new data (3,331 total instead of 8,037)
- Division breakdown shows correct divisions
- Champions coverage matches expected scope

## Phase 3: Validation

### Test Division Classification

```bash
# Check sample employees from different divisions
curl -s "https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json" | jq '
  .employees
  | group_by(.divisionId)
  | map({division: .[0].divisionId, count: length})
'
```

**Expected:** Reasonable distribution across divisions (not all "corporate")

### Test Function Classification

```bash
# Check function distribution
curl -s "https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json" | jq '
  .employees
  | group_by(.functionCategory)
  | map({function: .[0].functionCategory, count: length})
  | sort_by(-.count)
'
```

**Expected:** <20% classified as "Other"

### Test Reporting Type

```bash
# Check corporate vs divisional split
curl -s "https://orgdata-lca-bdcscyfrfjd8fdgh.a01.azurefd.net/organizational-data/org-hierarchy.json" | jq '
  .employees
  | group_by(.reportingType)
  | map({type: .[0].reportingType, count: length})
'
```

**Expected:** Mostly "divisional", some "corporate"

### Test Coverage in App

1. Open ai-champions-tracker
2. Navigate to Overview tab
3. Verify total employee count is ~3,331 (not 8,037)
4. Check coverage percentage
5. Navigate to Coverage Analysis tab
6. Verify division structure matches actual org
7. Check champion assignments show correctly

## Rollback Plan

If issues arise:

### Rollback org-data-sync-function

```bash
cd /Users/mirlca/Library/CloudStorage/OneDrive-Teradyne/Documents/Notes/05-shared/org-data-sync-function

# Revert to previous commit
git log --oneline  # Find last working commit
git revert <commit-hash>
git push origin main

# Trigger manual sync to restore previous data
python manual_sync_now.py
```

### Rollback ai-champions-tracker

```bash
cd /Users/mirlca/Library/CloudStorage/OneDrive-Teradyne/Documents/Notes/05-shared/apps/ai-champions-tracker

# Restore static orgHierarchy.json from git history
git checkout HEAD~1 -- frontend/src/data/orgHierarchy.json

# Revert code changes
git revert <commit-hash>
git push origin main
```

## Success Criteria

- ✅ org-hierarchy.json includes new fields: `divisionId`, `functionCategory`, `reportingType`
- ✅ Summary includes `divisions`, `corporate`, and `functionSummary` arrays
- ✅ Division classifications are >90% accurate (spot check)
- ✅ Function classifications have <20% "Other" category
- ✅ ai-champions-tracker loads data from CDN successfully
- ✅ Coverage statistics update correctly
- ✅ UI reflects actual organization structure (3,331 employees)
- ✅ No performance regression (load time <3s)

## Timeline

- **Phase 1:** 4-6 hours (org-data-sync-function enhancement)
- **Phase 2:** 3-4 hours (ai-champions-tracker integration)
- **Phase 3:** 1-2 hours (validation and fixes)

**Total:** 8-12 hours

---

**Status:** Ready to implement
**Next Step:** Begin Phase 1, Step 1.1 (Add Configuration)
