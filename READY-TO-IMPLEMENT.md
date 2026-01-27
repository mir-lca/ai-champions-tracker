---
created: 2026-01-24
type: reference
status: ready
jira: https://teradyne-robotics.atlassian.net/browse/AI-228
---

# Ready to Implement: Enhanced Org Data Structure

## Summary

We now have complete organizational structure information to enhance the org-data-sync-function:

✅ **3 Divisions** with confirmed presidents
✅ **13 Business Units** with confirmed leaders
✅ **Shared Engineering** groups identified
✅ **Corporate Functions** defined
✅ **Matrix scope** configuration confirmed

## What Will Be Added to org-hierarchy.json

### New Employee Fields:
- `division` - "Robotics", "Product Test", "Semiconductor Test", "Corporate"
- `divisionId` - "robotics", "product-test", "semiconductor-test", "corporate"
- `divisionHeadEmail` - Email of division president
- `businessUnit` - "Universal Robots", "Compute Test", etc. (or null for division-level)
- `businessUnitId` - "ur", "compute-test", etc. (or null)
- `businessUnitLeaderEmail` - Email of BU leader (or null)
- `functionCategory` - "Engineering - Software", "HR", "Sales", etc.
- `reportingType` - "corporate" or "divisional"

### Enhanced Summary Object:
```json
{
  "summary": {
    "divisions": [
      {
        "id": "semiconductor-test",
        "name": "Semiconductor Test",
        "headcount": 1500,
        "divisionHeadEmail": "shannon.poulin@teradyne.com",
        "businessUnits": [
          {
            "id": "compute-test",
            "name": "Compute Test",
            "headcount": 450,
            "leaderEmail": "roy.chorev@teradyne.com"
          }
        ],
        "functions": [
          {
            "category": "Engineering - Software",
            "headcount": 600
          }
        ]
      }
    ],
    "corporate": [
      {
        "category": "HR",
        "headcount": 45
      }
    ],
    "functionSummary": [
      {
        "category": "Engineering - Software",
        "totalHeadcount": 850,
        "corporateHeadcount": 0,
        "divisionalHeadcount": 850,
        "breakdown": [...]
      }
    ]
  }
}
```

## Configuration Required

### Environment Variables for org-data-sync-function:

```bash
ORG_DIVISION_HEADS='{
  "robotics": "jpha@universal-robots.com",
  "product-test": "regan.mills@teradyne.com",
  "semiconductor-test": "shannon.poulin@teradyne.com"
}'

ORG_BU_HEADS='{
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
}'

ORG_CORPORATE_FUNCTION_CATEGORIES='["HR", "Finance", "IT", "Legal", "Operations", "Supply Chain"]'
```

## Files to Create/Modify

### org-data-sync-function:
1. **Create:** `org_classifiers.py` - Classification logic
2. **Modify:** `generate_org_hierarchy.py` - Use classifiers
3. **Modify:** `local.settings.json` - Add config
4. **Modify:** `README.md` - Document new schema

### ai-champions-tracker:
1. **Create:** `frontend/src/api/orgDataClient.js` - Fetch from CDN
2. **Create:** `frontend/src/config/orgStructure.js` - Matrix scope config
3. **Create:** `frontend/src/utils/computeCoverage.js` - Coverage computation
4. **Modify:** `frontend/src/App.jsx` - Use CDN data
5. **Delete:** `frontend/src/data/orgHierarchy.json` - Remove static file
6. **Modify:** `frontend/src/data/championsData.json` - Update structure

## Expected Outcomes

### Data Quality:
- ✅ Division classification: >95% accurate (based on manager hierarchy)
- ✅ BU classification: ~90% accurate (based on manager hierarchy + email domain)
- ✅ Function classification: <15% "Other" category
- ✅ Corporate vs divisional: >95% accurate

### Performance:
- ⚡ CDN cache: 5 minutes
- ⚡ React Query cache: 5 minutes (matches CDN)
- ⚡ App load time: <3 seconds (no change from current)

### Data Accuracy:
- 📊 Total employees: 3,331 (correct, not 8,037)
- 📊 Divisions: 3 (Robotics, Product Test, Semiconductor Test)
- 📊 Business Units: 13 (2 Robotics, 4 Product Test, 7 Semiconductor Test)
- 📊 Functions: ~12 categories (Engineering, Sales, Marketing, HR, etc.)

## Special Handling

### 1. Shared Engineering (Semiconductor Test)
- Employees reporting to Randy Kramer or Dan Santos
- Division: Semiconductor Test
- BU: null (division-level)
- Function: Engineering - [Software/Hardware/etc.]

### 2. JP Hathout Dual Role
- Division President: Robotics
- BU Leader: UR
- Employees @universal-robots.com → UR BU
- Employees @mir-robots.com → MiR BU
- Division-level roles (CFO, CMO) → Division-level, no BU

### 3. Memory Test Two Leaders
- Both Ben Han and Young Kim are BU leaders
- Algorithm: Report to either → Memory Test BU
- Email @nextest.com → Memory Test BU

## Implementation Phases

### Phase 1: Division + Function Classification (4-6 hours)
- Add division classification (manager hierarchy)
- Add function classification (job title patterns)
- Add reporting type (corporate vs divisional)
- Generate basic summary

### Phase 2: Business Unit Classification (2-3 hours)
- Add BU classification (manager hierarchy)
- Handle special cases (shared eng, dual roles)
- Generate enhanced summary with BU breakdown

### Phase 3: ai-champions-tracker Integration (3-4 hours)
- Replace static data with CDN fetch
- Update coverage computation
- Test and validate

### Phase 4: Validation & Refinement (2-3 hours)
- Spot-check classifications
- Refine function patterns if needed
- Handle edge cases

**Total Estimated Time:** 11-16 hours

## Risk Mitigation

### Rollback Strategy:
- Git history preserved for both repos
- Can revert to previous CDN data via manual_sync_now.py
- ai-champions-tracker can restore static orgHierarchy.json from git

### Testing Strategy:
1. Test locally with test_locally.py first
2. Validate output structure and sample classifications
3. Deploy to Azure Function but don't sync yet
4. Run manual_sync_now.py to push to CDN
5. Verify CDN data before updating ai-champions-tracker
6. Test ai-champions-tracker locally before deploying

### Validation:
- Spot-check 50 employees across divisions
- Verify coverage calculations match expectations
- Confirm UI displays correctly
- Monitor for errors in production

## Next Steps

1. **Review this summary** - Confirm structure is correct
2. **Approve implementation** - Ready to begin Phase 1
3. **Begin coding** - Start with org_classifiers.py
4. **Test locally** - Validate classifications
5. **Deploy** - Push to production

---

**Status:** 🟢 Ready to implement
**Confidence:** High (all data confirmed, structure documented, plan complete)
**Risk:** Low (can rollback, incremental deployment)
