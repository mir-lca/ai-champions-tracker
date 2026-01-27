# AI Champions Coverage Tracker - Repository Location

**Primary Repository:** `~/ai-champions-tracker` (GitHub: mir-lca/ai-champions-tracker)
**Shared Copy:** `05-shared/apps/ai-champions-tracker` (OneDrive - documentation/reference)

## Purpose

This is a **reference copy** of the ai-champions-tracker repository stored in OneDrive for documentation and backup purposes.

**Primary development** should happen in `~/ai-champions-tracker` (outside OneDrive) to avoid git sync conflicts.

## Repository Contents

### Core Application
- **frontend/** - React + Vite web application
- **scripts/** - Data sync scripts (markdown → JSON conversion)
- **data/** - Source data (champions-coverage-tracking.md)

### Documentation
- **README.md** - Main project documentation
- **IMPLEMENTATION_STATUS.md** - Current implementation progress
- **AUTHENTICATION-SETUP.md** - Azure AD auth configuration guide
- **DEPLOYMENT.md** - Deployment procedures

### Additional Docs (docs/)
- **champions-coverage-tracking.md** - Source data for champions roster
- **ai-enablement-champion-brief.md** - Champion role description
- **AI-228-README.md** - Parent project (AI-228: Champions Framework) overview
- **champions-tracker-mockup.html** - Validated UI/UX mockup

## Deployment

**Live Application:** https://mango-forest-0fc04f60f.1.azurestaticapps.net
**GitHub Actions:** Auto-deploys on push to main branch
**Azure Resource:** champions-tracker-swa-lca (Static Web App)

## Data Architecture

**Centralized Org Data Backend:**
- See `05-shared/org-data-sync-function/` for backend service
- Fetches from: `https://orgdatastoragelca.blob.core.windows.net/organizational-data/org-hierarchy.json`
- Weekly sync: Sunday 6 AM UTC via Azure Function

**Champions Data:**
- Source: `data/champions-coverage-tracking.md`
- Build: `npm run sync-champions` (converts markdown → JSON)
- Output: `frontend/src/data/championsData.json`

## Working with This Repository

### Development Workflow

1. **Primary work location:** `~/ai-champions-tracker`
2. **Make changes and test:** `cd ~/ai-champions-tracker/frontend && npm run dev`
3. **Commit and push:** Triggers GitHub Actions deployment
4. **Sync to OneDrive copy:** `cp -r ~/ai-champions-tracker/* "05-shared/apps/ai-champions-tracker/"`

### OneDrive Copy Usage

- ✅ Reference documentation
- ✅ Backup and archival
- ✅ Share with team (read-only)
- ❌ Direct git operations (use ~/ai-champions-tracker instead)

## Related Components

- **org-data-sync-function** (`05-shared/org-data-sync-function/`) - Centralized org data backend
- **organizational-data** (`05-shared/organizational-data/`) - Static org data exports
- **shared-components** (`05-shared/shared-components/`) - Reusable UI widgets (user menu, app nav)

## Links

- **GitHub Repo:** https://github.com/mir-lca/ai-champions-tracker
- **Jira Epic:** [AI-228: Champions Framework](https://teradyne-robotics.atlassian.net/browse/AI-228)
- **Parent Project:** `01-projects/AI-227: VC And Performance Goals/AI-228: Champions Framework/`
