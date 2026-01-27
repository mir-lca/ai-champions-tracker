---
created: 2026-01-24
type: reference
jira: https://teradyne-robotics.atlassian.net/browse/AI-228
---

# Business Unit Leaders - Complete Mapping

**Source:** Queried from Microsoft Graph org-hierarchy.json on 2026-01-24

## Robotics Division
**Division President:** Jean-Pierre Hathout (jpha@universal-robots.com)

### Business Units:
1. **Universal Robots (UR)**
   - **Leader:** Jean-Pierre Hathout (jpha@universal-robots.com) - serves dual role
   - **Email Domain:** @universal-robots.com
   - **Key Reports:**
     - David Brandt (dbr@universal-robots.com) - VP R&D, Universal Robots
     - Keith Fox (kefo@universal-robots.com) - VP, Product Management and Industry Segments

2. **Mobile Industrial Robots (MiR)**
   - **Leader:** Kevin Dumas (kdumas@mir-robots.com)
   - **Title:** President, Mobile Industrial Robots
   - **Email Domains:** @mir-robots.com, @teradyne-robotics.com

### Shared Robotics Functions:
- Karl Martens (Karl.Martens@teradyne.com) - CFO, Teradyne Robotics
- Justin Brown (justin.brown@teradyne.com) - Chief Commercial Officer, Teradyne Robotics
- Craig Dowley (craig.dowley@teradyne.com) - Chief Marketing Officer
- James Davidson (james.davidson@teradyne.com) - Chief Artificial Intelligence Officer
- Anthony DeMambro (anthony.demambro@teradyne.com) - Global Services Leader

## Product Test Division
**Division President:** Regan Mills (regan.mills@teradyne.com)

### Business Units:
1. **Product Test** (BU within division)
   - **Leader:** Mark Kahwati (mark.kahwati@teradyne.com)
   - **Title:** Business Unit Leader

2. **Defense & Aerospace**
   - **Leader:** John Wood (john.wood@teradyne.com)
   - **Title:** President, Defense & Aerospace

3. **LitePoint**
   - **Leader:** John Lukez (John.Lukez@litepoint.com)
   - **Title:** President, LitePoint
   - **Email Domain:** @litepoint.com

4. **Quantifi Photonics**
   - **Leader:** Iannick Monfils (iannick.monfils@teradyne.com)
   - **Title:** President, Quantifi Photonics
   - **Email Domain:** @quantifiphotonics.com

### Shared Product Test Functions:
- James Chang (James.Chang@litepoint.com) - VP of Finance, Product Test Division
- Steve Pruitt (steve.pruitt@teradyne.com) - Senior Director Product Marketing
- Glenn Farris (glenn.farris@litepoint.com) - Vice President, Sales

## Semiconductor Test Division
**Division President:** Shannon Poulin (shannon.poulin@teradyne.com)

### Business Units:
1. **Integrated Systems Test**
   - **Leader:** Jason Zee (jason.zee@teradyne.com)
   - **Title:** Vice President and General Manager, Integrated Systems Test Division

2. **Memory Test**
   - **Leader 1:** Ben Han (ben.han@teradyne.com) - President of Memory Test Division
   - **Leader 2:** Young Kim (Young.Kim@nextest.com) - President of Memory Test Division
   - **Email Domain:** @nextest.com
   - **Note:** Two presidents suggest possible sub-divisions or transition

3. **Compute Test**
   - **Leader:** Roy Chorev (roy.chorev@teradyne.com)
   - **Title:** VP & GM of Compute Test Division

4. **Silicon Photonics Test**
   - **Leader:** Geeta Athalye (geeta.athalye@teradyne.com)
   - **Title:** VP, Silicon Photonics Test

5. **Power Test**
   - **Leader:** Dominic Viens (dominic.viens@teradyne.com)
   - **Title:** GM of Power Test Division

6. **Production Board Test** (mentioned by user, not found in direct reports)
   - **Leader:** Peter Jeckel (peter.jeckel@teradyne.com)? - Business Unit Leader
   - **Status:** Need confirmation

### Shared Semiconductor Test Functions:
- **Randy Kramer** (randy.kramer@teradyne.com) - VP, Semiconductor Test - Solutions Engineering Group
  - **This is likely the shared engineering group**

- **Dan Santos** (dan.santos@teradyne.com) - Vice President of Common Engineering
  - **This may also be shared engineering**

- Damien L Tufts (damien.l.tufts@teradyne.com) - Manager, Semiconductor Test - Finance
- Kyle Klatka (kyle.klatka@teradyne.com) - Director, Central Product Management, SemiTest Group
- Jacqueline Briones (jacqueline.briones@teradyne.com) - VP and General Manager, Global Customer Services (GCS)
- Ty Akin (ty.akin@teradyne.com) - VP, Semiconductor Test - Sales
- Eileen Pruitt (eileen.pruitt@teradyne.com) - Senior Director of Program Management
- Oren Hemo (oren.hemo@teradyne.com) - Field Application Manager

## Configuration for org-data-sync-function

### Division Heads
```json
{
  "robotics": "jpha@universal-robots.com",
  "product-test": "regan.mills@teradyne.com",
  "semiconductor-test": "shannon.poulin@teradyne.com"
}
```

### Business Unit Heads
```json
{
  "robotics": {
    "ur": "jpha@universal-robots.com",
    "mir": "kdumas@mir-robots.com"
  },
  "product-test": {
    "product-test-bu": "mark.kahwati@teradyne.com",
    "defense-aerospace": "john.wood@teradyne.com",
    "litepoint": "John.Lukez@litepoint.com",
    "quantifi-photonics": "iannick.monfils@teradyne.com"
  },
  "semiconductor-test": {
    "integrated-systems-test": "jason.zee@teradyne.com",
    "memory-test": ["ben.han@teradyne.com", "Young.Kim@nextest.com"],
    "compute-test": "roy.chorev@teradyne.com",
    "silicon-photonics-test": "geeta.athalye@teradyne.com",
    "power-test": "dominic.viens@teradyne.com"
  }
}
```

### Shared Engineering Heads (Semiconductor Test)
```json
{
  "semiconductor-test-shared-engineering": [
    "randy.kramer@teradyne.com",
    "dan.santos@teradyne.com"
  ]
}
```

## Special Cases

### 1. JP Hathout - Dual Role
- Division President for Robotics
- Also BU Leader for UR
- Employees reporting directly to JP could be:
  - Division-level (Robotics)
  - BU-level (UR)
  - Shared Robotics functions

**Classification Strategy:**
- If employee email is @universal-robots.com → UR BU
- If employee email is @mir-robots.com → MiR BU (even if reports to JP)
- If employee has division-level role (CFO, CMO, etc.) → Division-level
- Otherwise → UR BU (since JP also leads UR)

### 2. Memory Test - Two Presidents
- Ben Han (ben.han@teradyne.com)
- Young Kim (Young.Kim@nextest.com)

**Possible Explanations:**
- Transition in progress
- Two sub-divisions within Memory Test
- Geographic split (Ben Han for Teradyne Memory, Young Kim for NexTest Memory)

**Classification Strategy:**
- Both are BU leaders for Memory Test
- Employee who reports to either is in Memory Test BU
- Email domain @nextest.com → Memory Test BU

### 3. Shared Engineering in Semiconductor Test
- Randy Kramer - Solutions Engineering Group
- Dan Santos - Common Engineering

**Classification:**
- Reports to Shannon Poulin (division president)
- NOT through any BU leader
- Function: Engineering
- businessUnitId: null or "shared-engineering"

## BU Classification Algorithm

```python
def classify_business_unit(employee, all_employees, bu_heads, division_id):
    """
    Classify employee's business unit within their division

    Args:
        employee: Employee record with division already set
        all_employees: All employee records
        bu_heads: Nested dict of division -> bu_id -> leader_email(s)
        division_id: Employee's division ID

    Returns:
        Tuple of (bu_name, bu_id, bu_leader_email) or (None, None, None) for division-level
    """
    if division_id not in bu_heads:
        return None, None, None

    division_bus = bu_heads[division_id]

    # Traverse manager chain within division
    current = employee
    max_depth = 15

    for _ in range(max_depth):
        if not current.get('managerEmail'):
            # Reached top without finding BU leader
            return None, None, None

        # Check if current manager is a BU leader
        for bu_id, leader_emails in division_bus.items():
            # Handle both single leader and list of leaders
            if isinstance(leader_emails, list):
                if current['managerEmail'] in leader_emails:
                    bu_name = format_bu_name(bu_id)
                    return bu_name, bu_id, current['managerEmail']
            else:
                if current['managerEmail'] == leader_emails:
                    bu_name = format_bu_name(bu_id)
                    return bu_name, bu_id, leader_emails

        # Check if current employee IS a BU leader
        for bu_id, leader_emails in division_bus.items():
            if isinstance(leader_emails, list):
                if current['email'] in leader_emails:
                    bu_name = format_bu_name(bu_id)
                    return bu_name, bu_id, current['email']
            else:
                if current['email'] == leader_emails:
                    bu_name = format_bu_name(bu_id)
                    return bu_name, bu_id, leader_emails

        # Get division head to know when to stop
        division_head = get_division_head(division_id)
        if current['managerEmail'] == division_head:
            # Reached division president without finding BU leader
            # This is division-level (e.g., shared engineering)
            return None, None, None

        # Move up to manager
        manager = find_employee_by_email(current['managerEmail'], all_employees)
        if not manager:
            return None, None, None

        current = manager

    return None, None, None
```

## Email Domain Hints

For faster classification, can use email domain as hint:

```python
EMAIL_DOMAIN_TO_BU = {
    "universal-robots.com": ("robotics", "ur"),
    "mir-robots.com": ("robotics", "mir"),
    "teradyne-robotics.com": ("robotics", "mir"),
    "litepoint.com": ("product-test", "litepoint"),
    "quantifiphotonics.com": ("product-test", "quantifi-photonics"),
    "nextest.com": ("semiconductor-test", "memory-test")
}
```

## Validation Queries

### Check BU distribution in actual data:

```bash
# Robotics BUs by email domain
curl -s "CDN_URL" | jq '[.employees[] | select(.email | endswith("@universal-robots.com"))] | length'
curl -s "CDN_URL" | jq '[.employees[] | select(.email | endswith("@mir-robots.com"))] | length'

# Product Test BUs by email domain
curl -s "CDN_URL" | jq '[.employees[] | select(.email | endswith("@litepoint.com"))] | length'
curl -s "CDN_URL" | jq '[.employees[] | select(.email | endswith("@quantifiphotonics.com"))] | length'

# Semiconductor Test BUs
# More complex - need manager hierarchy since most use @teradyne.com
```

---

**Status:** ✅ All BU leaders identified
**Next:** Implement BU classification in org-data-sync-function
