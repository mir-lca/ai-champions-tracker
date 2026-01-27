---
created: 2026-01-24
type: reference
jira: https://teradyne-robotics.atlassian.net/browse/AI-228
---

# Actual Teradyne Organization Structure

**Source:** Confirmed by user on 2026-01-24
**Total Employees:** 3,331 (from Microsoft Graph)

## Corporate Functions

**Key Insight:** Not all corporate functions report directly to CEO. Some report through other C-suite (e.g., IT reports to CFO).

| Function | Reports To | Notes |
|----------|-----------|-------|
| HR | CEO (Jim Mahon - CHRO) | Corporate only |
| Finance | CEO (Michelle Turner - CFO) | Corporate + divisional |
| IT | CFO | Corporate + divisional |
| Legal | CEO (Ryan Driscoll - General Counsel) | Corporate only |
| Operations | CEO (Sanjay Mehta) | Corporate function |
| Supply Chain | TBD | Corporate function |

**Corporate Function Classification:**
- Employees in these functions serve the entire organization
- May report to CEO or other C-suite (like IT → CFO)
- Classification based on function category, not reporting line to CEO

## Divisions

### 1. Robotics Division

**Division President:** Jean-Pierre Hathout (jpha@universal-robots.com)

**Business Units:**
- **Universal Robots (UR)**
  - BU Leader: Jean-Pierre Hathout (jpha@universal-robots.com)
  - Email domain: @universal-robots.com
  - Count: ~583 employees

- **Mobile Industrial Robots (MiR)**
  - BU Leader: Kevin Dumas
  - Email domains: @mir-robots.com, @teradyne-robotics.com
  - Count: ~246 employees (204 + 42)

**Divisional Functions:**
- Sales
- Field Applications
- Marketing
- Engineering teams

### 2. Product Test Division

**Division President:** Regan Mills (regan.mills@teradyne.com)

**Business Units:**
- **Quantify Photonics**
  - BU Leader: Iannick Monfils
  - Email domain: @quantifiphotonics.com
  - Count: ~2 employees

- **LitePoint**
  - BU Leader: John Lukez
  - Email domain: @litepoint.com
  - Count: ~289 employees

- **Defense & Aerospace**
  - BU Leader: John Wood

- **Product Test** (also a BU within the division)
  - BU Leader: Mark Kahwati

**Divisional Functions:**
- Sales
- Field Applications
- Marketing
- Engineering teams

### 3. Semiconductor Test Division

**Division President:** Shannon Poulin (shannon.poulin@teradyne.com)

**Business Units:**
- **Memory Test**
  - BU Leader: Ben Han

- **Power Test**
  - BU Leader: Dominic Viens

- **Silicon Photonics Test**
  - BU Leader: Geeta Athalye

- **Integrated Systems Test**
  - BU Leader: Jason Zee

- **Compute Test**
  - BU Leader: Roy Chorev

**Special Structure:**
- **Shared Engineering Group** at division level (not BU-specific)

**Divisional Functions:**
- Sales
- Field Applications
- Marketing
- Engineering teams (both BU-specific and shared)

## Email Domains by Division/BU

From actual Microsoft Graph data:

| Domain | Count | Maps To |
|--------|-------|---------|
| teradyne.com | 2,079 | Multiple (Semiconductor Test, Product Test, Corporate) |
| universal-robots.com | 583 | Robotics → UR BU |
| litepoint.com | 289 | Product Test → LitePoint BU |
| mir-robots.com | 204 | Robotics → MiR BU |
| nextest.com | 129 | Product Test (likely) |
| teradyne-robotics.com | 42 | Robotics → MiR BU |
| quantifiphotonics.com | 2 | Product Test → Quantify Photonics BU |
| lemsys.com | 2 | Unknown |

## Classification Strategy

### Division Classification

**Method:** Manager hierarchy traversal to find division president

**Division Presidents:**
- Robotics: jpha@universal-robots.com (Jean-Pierre Hathout)
- Product Test: regan.mills@teradyne.com (Regan Mills)
- Semiconductor Test: shannon.poulin@teradyne.com (Shannon Poulin)

**Algorithm:**
1. Start with employee
2. Traverse up manager chain
3. If hit a division president, employee belongs to that division
4. If hit CEO without finding division president, employee is Corporate

### Business Unit Classification

**Method:** Manager hierarchy traversal to find BU leader

**BU Leaders:**

**Robotics:**
- UR: jpha@universal-robots.com (Jean-Pierre Hathout)
- MiR: kevin.dumas@??? (need to find email)

**Product Test:**
- Quantify Photonics: iannick.monfils@??? (need to find email)
- LitePoint: john.lukez@??? (need to find email)
- Defense & Aerospace: john.wood@teradyne.com (found in previous data)
- Product Test BU: mark.kahwati@??? (need to find email)

**Semiconductor Test:**
- Memory Test: ben.han@??? (need to find email)
- Power Test: dominic.viens@??? (need to find email)
- Silicon Photonics Test: geeta.athalye@??? (need to find email)
- Integrated Systems Test: jason.zee@??? (need to find email)
- Compute Test: roy.chorev@??? (need to find email)

**Algorithm:**
1. Start with employee in a division
2. Traverse up manager chain within division
3. If hit a BU leader, employee belongs to that BU
4. If hit division president without finding BU leader, employee is division-level (e.g., Shared Engineering in Semiconductor Test)
5. For UR/MiR, can also use email domain as strong signal

### Corporate vs Divisional Reporting

**Revised Understanding:**
- **Corporate functions** are identified by function category (HR, Finance, IT, Legal, Operations, Supply Chain)
- **Corporate employees** work in corporate functions regardless of who they report to
- **Divisional employees** work in divisions/BUs (even if function is similar, e.g., divisional Finance vs corporate Finance)

**Key Change:** IT reports to CFO, not CEO, but is still corporate because it's a corporate function

**Classification Algorithm:**
1. Identify employee's function category from job title
2. If function category is a corporate function (HR, Finance, IT, Legal, Operations, Supply Chain):
   - Check if employee reports through division president
   - If NO → Corporate
   - If YES → Divisional (e.g., divisional finance reporting to division president but matrixed to corporate CFO)
3. If function category is not corporate function (Engineering, Sales, Marketing, etc.):
   - Must be divisional

**Example Cases:**

| Employee | Job Title | Manager Chain | Classification | Reason |
|----------|-----------|---------------|----------------|--------|
| Jane | "IT Manager" | Reports to CFO | Corporate | IT function, reports to corporate head |
| John | "IT Manager, Robotics" | Reports to Robotics President | Divisional | IT function, but reports to division |
| Mary | "HR Business Partner" | Reports to CHRO | Corporate | HR function, reports to corporate head |
| Bob | "Software Engineer" | Reports to UR leader | Divisional | Engineering function, always divisional |
| Alice | "Finance Analyst, Semiconductor Test" | Reports to Sem Test President → CFO | Divisional | Finance function, but reports to division first |

## Function Categories

### Corporate Functions
- HR
- Finance
- IT
- Legal
- Operations
- Supply Chain

### Divisional Functions
- Engineering - Software
- Engineering - Hardware
- Engineering - Applications
- Product Management
- Sales
- Field Applications
- Marketing
- Manufacturing
- Quality

## Shared Engineering in Semiconductor Test

**Special Case:** Semiconductor Test has a "Shared Engineering Group" at division level

**How to identify:**
- Employees report to division president (Shannon Poulin)
- Job titles contain "engineer" or engineering keywords
- Do NOT report through any BU leader

**Classification:**
- Division: Semiconductor Test
- BU: null (or "shared-engineering")
- Function: Engineering - [Software/Hardware/etc.]
- Reporting Type: Divisional

## Matrix Scope Revised

| Function | Matrix Scope | Corporate Champion Covers | Divisional Champion Covers |
|----------|-------------|---------------------------|----------------------------|
| HR | Corporate | All HR (corporate + all divisional) | N/A |
| Finance | Corporate + Divisional | All Finance (corporate + all divisional) | N/A |
| IT | Corporate + Divisional | All IT (corporate + all divisional) | N/A |
| Legal | Corporate | All Legal | N/A |
| Operations | Corporate | All Operations | N/A |
| Supply Chain | Corporate | All Supply Chain | N/A |
| Marketing | Per-Division | N/A | Only their division |
| Sales | Per-Division | N/A | Only their division |
| Field Applications | Per-Division | N/A | Only their division |
| Engineering - Software | Per-BU | N/A | Only their BU (or division if shared eng) |
| Engineering - Hardware | Per-BU | N/A | Only their BU (or division if shared eng) |

## Data to Find in Microsoft Graph

To complete the BU mapping, need to find these employees:

**Robotics:**
- Kevin Dumas (MiR BU Leader)

**Product Test:**
- Iannick Monfils (Quantify Photonics)
- John Lukez (LitePoint)
- Mark Kahwati (Product Test BU) - found in previous data

**Semiconductor Test:**
- Ben Han (Memory Test)
- Dominic Viens (Power Test)
- Geeta Athalye (Silicon Photonics Test)
- Jason Zee (Integrated Systems Test)
- Roy Chorev (Compute Test)

**Query Strategy:**
```bash
# Find employees reporting directly to division presidents
curl -s "CDN_URL" | jq '
  .employees[]
  | select(.managerEmail == "jpha@universal-robots.com" or
           .managerEmail == "regan.mills@teradyne.com" or
           .managerEmail == "shannon.poulin@teradyne.com")
  | {name: .displayName, email: .email, title: .jobTitle, manager: .managerEmail}
'
```

## Implementation Priority

### Phase 1: Division + Function Classification
- ✅ Known data: Division presidents
- ✅ Known data: Corporate function categories
- Can implement immediately

### Phase 2: Business Unit Classification
- ⚠️ Need to find BU leader emails first
- Can implement once emails identified
- For now, can use email domain as proxy for UR/MiR/LitePoint

### Phase 3: Shared Engineering Handling
- Handle special case of Semiconductor Test shared engineering
- Employees who report to division president but have engineering function

---

**Next Steps:**
1. Query Microsoft Graph data to find BU leader emails
2. Update implementation plan with actual structure
3. Implement division + function classification first
4. Add BU classification once leaders identified
