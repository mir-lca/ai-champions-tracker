# AI Champions Coverage Tracker

React web app to track AI champion appointments and organizational coverage across Teradyne's 8,037 employees.

## Overview

Visualizes coverage gaps by division/function, monitors champion appointments, and provides executive dashboard visibility for the AI Champions Framework initiative.

## Project Structure

```
ai-champions-tracker/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── data/          # Static JSON data files
│   │   ├── utils/         # Helper functions
│   │   └── styles/        # CSS styles
│   └── package.json
├── scripts/               # Data sync scripts
└── data/                  # Source data files
```

## Features

- **Overview Dashboard**: Summary metrics, coverage gauge, division breakdown
- **Champions Roster**: Searchable table with drill-down to champion details
- **Coverage Analysis**: Hierarchical view by division/BU/function

## Tech Stack

- React 18
- Vite 5
- Recharts 2.10.3
- TanStack React Query 5.14.2
- Axios 1.6.2

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
```

## Data Management

Champions data is sourced from `data/champions-coverage-tracking.md` and synced to JSON files.

### Manual Update Workflow

1. Edit `data/champions-coverage-tracking.md`
2. Run `npm run sync-champions` (script to be implemented)
3. Commit and push to deploy

## Deployment

**Live App:** https://mango-forest-0fc04f60f.1.azurestaticapps.net

Deployed to Azure Static Web Apps via GitHub Actions. Auto-deploys on push to `main` branch.

## Links

- **Jira Epic**: [AI-228: Champions Framework](https://teradyne-robotics.atlassian.net/browse/AI-228)
- **Mockup**: `01-projects/AI-227: VC And Performance Goals/AI-228: Champions Framework/dashboards/champions-tracker-mockup.html`
- **Source Data**: `data/champions-coverage-tracking.md`

## Status

**Deployed:** ✅ Live at https://mango-forest-0fc04f60f.1.azurestaticapps.net
**Phase 1 & 2:** Complete - Overview, Champions, and Coverage Analysis tabs functional
**Next:** Azure AD authentication configuration
