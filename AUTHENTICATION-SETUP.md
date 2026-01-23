---
created: 2026-01-23
type: implementation-guide
status: complete
---

# Azure AD Authentication Setup - Champions Tracker

**Date:** January 23, 2026
**Status:** ✅ Complete and Functional

## Summary

Successfully configured Azure AD authentication for the AI Champions Coverage Tracker using the existing MiR Customer SSO app registration. The app now requires Teradyne login and includes a user menu widget for cross-app navigation.

## Changes Implemented

### 1. Azure Static Web App Upgrade
- **Tier:** Upgraded from Free → Standard
- **Reason:** Free tier doesn't support custom OIDC providers
- **Cost Impact:** ~$9/month (first app is free, subsequent apps $9/month)

### 2. Azure AD Configuration
- **App Registration:** MiR Customer SSO (c05a649d-95b5-4dd7-a1ff-f48e274538e9)
- **Tenant:** Teradyne (eae846e4-996d-4b47-83b9-5f5937d358fe)
- **Provider Name:** `teradyne` (used in redirect URIs)
- **Redirect URI:** https://mango-forest-0fc04f60f.1.azurestaticapps.net/.auth/login/teradyne/callback
- **No User Consent Required:** Uses minimal permissions (User.Read, User.Read.All, GroupMember.Read.All)

### 3. App Settings Configured
```bash
AAD_CLIENT_ID=c05a649d-95b5-4dd7-a1ff-f48e274538e9
AAD_CLIENT_SECRET=<redacted> (expires 2028-01-23)
```

**Note:** Client secret is stored securely in Azure Static Web App settings, not in source control.

### 4. Static Web App Configuration
**File:** `frontend/public/staticwebapp.config.json`

**Key Features:**
- Assets (`/assets/*`, `*.css`, `*.js`) accessible before authentication
- Shared components (`/shared-components/*`) accessible before authentication
- All other routes require authentication
- 401 responses redirect to `/.auth/login/teradyne`
- Navigation fallback to `/index.html` for SPA routing

**Route Order (Critical):**
```json
{
  "routes": [
    {"route": "/.auth/*", "allowedRoles": ["anonymous", "authenticated"]},
    {"route": "/assets/*", "allowedRoles": ["anonymous", "authenticated"]},
    {"route": "/data/*", "allowedRoles": ["anonymous", "authenticated"]},
    {"route": "/shared-components/*", "allowedRoles": ["anonymous", "authenticated"]},
    {"route": "/*.css", "allowedRoles": ["anonymous", "authenticated"]},
    {"route": "/*.js", "allowedRoles": ["anonymous", "authenticated"]},
    {"route": "/favicon.ico", "allowedRoles": ["anonymous", "authenticated"]},
    {"route": "/*", "allowedRoles": ["authenticated"]}
  ]
}
```

**Why Order Matters:** Asset routes MUST come before the catch-all `/*` route. Otherwise, unauthenticated users trying to load CSS/JS will get HTML redirects, causing MIME type errors.

### 5. User Menu Widget Integration

**Files Added:**
- `frontend/public/shared-components/user-menu.js` - Vanilla JS widget
- `frontend/public/shared-components/apps-manifest.json` - App registry
- User menu CSS added to `frontend/src/styles/main.css`
- Container added to `frontend/index.html`

**Widget Configuration:**
```javascript
const CONFIG = {
  currentAppId: 'champions-tracker', // Filter out current app
  repoUrl: 'https://github.com/mir-lca/ai-champions-tracker',
  azureResources: [
    {
      label: 'Static Web App',
      href: 'https://portal.azure.com/#@teradyne.com/resource/.../champions-tracker-swa-lca'
    }
  ]
};
```

**Widget Features:**
- Displays user name and email from `/.auth/me` endpoint
- Sign out button (redirects to `/.auth/logout`)
- Links to other apps (from apps-manifest.json)
- Links to GitHub repo and Azure portal
- Filters out current app from "other apps" list

### 6. Apps Manifest Updated

**Local:** `frontend/public/shared-components/apps-manifest.json`
**Global:** `05-shared/shared-components/apps-manifest.json` (in Notes workspace)

Added champions tracker entry:
```json
{
  "id": "champions-tracker",
  "name": "Champions coverage",
  "description": "Track AI champion appointments and organizational coverage",
  "url": "https://mango-forest-0fc04f60f.1.azurestaticapps.net"
}
```

## Authentication Flow

1. **Unauthenticated User:**
   - Tries to access `https://mango-forest-0fc04f60f.1.azurestaticapps.net`
   - Gets 401 response → Redirected to `/.auth/login/teradyne`
   - Azure Static Web Apps initiates OIDC flow with Azure AD
   - User logs in with Teradyne credentials
   - Redirected back to `/.auth/complete` → Original URL

2. **Authenticated User:**
   - Session cookie stored by Azure Static Web Apps
   - User info available at `/.auth/me` endpoint
   - User menu widget fetches and displays user info
   - Access granted to all app routes

3. **Sign Out:**
   - User clicks "Sign out" in menu
   - Redirected to `/.auth/logout?post_logout_redirect_uri=/`
   - Session cleared, redirected to home (triggers login again)

## Verification

### Auth Endpoint Test
```bash
curl -I "https://mango-forest-0fc04f60f.1.azurestaticapps.net/.auth/login/teradyne"
# Returns: HTTP/2 302 (redirect to Azure AD)
```

### User Info Endpoint
```bash
curl "https://mango-forest-0fc04f60f.1.azurestaticapps.net/.auth/me"
# Returns:
{
  "clientPrincipal": {
    "identityProvider": "teradyne",
    "userId": "<user-id>",
    "userDetails": "User Name",
    "userRoles": ["authenticated", "anonymous"],
    "claims": [...]
  }
}
```

### Asset Loading
```bash
curl -I "https://mango-forest-0fc04f60f.1.azurestaticapps.net/assets/index-xyz.css"
# Returns: HTTP/2 200, Content-Type: text/css (NOT text/html)
```

## Deployment

**GitHub Actions:** Auto-deploy on push to `main` branch
**Status:** ✅ Build succeeded (1m 12s)
**Latest Commit:** `7862049` - Configure Azure AD authentication and user menu widget

**Deployment Notes:**
- First attempt failed with "Deployment Canceled" (transient Azure issue)
- Retry succeeded immediately
- Build time: ~1 minute
- Total pipeline time: ~1 minute 12 seconds

## Troubleshooting Reference

### Common Issues (from azure-ad-auth skill)

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 on `/.auth/login/*` | Free tier | Upgrade to Standard ✅ Done |
| 404 on `/.auth/login/*` | Config not deployed | Ensure `staticwebapp.config.json` in `public/` ✅ Done |
| MIME type errors (CSS/JS) | Assets blocked by auth | Add asset routes BEFORE `/*` catch-all ✅ Done |
| Blank page, "text/html not valid JS" | Assets returning HTML redirect | Add `/assets/*`, `/*.css`, `/*.js` with anonymous access ✅ Done |
| Wrong app used | Old app settings | Remove old `AZURE_CLIENT_*` settings (N/A - fresh setup) |
| Redirect loop | Missing redirect URI | Add callback URI to app registration ✅ Done |

### If Authentication Stops Working

1. **Check app settings are present:**
   ```bash
   az staticwebapp appsettings list --name champions-tracker-swa-lca --resource-group cursor-adoption-rg
   ```
   Should return `AAD_CLIENT_ID` and `AAD_CLIENT_SECRET` (redacted)

2. **Check tier is Standard:**
   ```bash
   az staticwebapp show --name champions-tracker-swa-lca --resource-group cursor-adoption-rg --query "sku.tier"
   ```
   Should return `"Standard"`

3. **Check redirect URI is configured:**
   ```bash
   az ad app show --id c05a649d-95b5-4dd7-a1ff-f48e274538e9 --query "web.redirectUris" -o json
   ```
   Should include `https://mango-forest-0fc04f60f.1.azurestaticapps.net/.auth/login/teradyne/callback`

4. **Check config deployed:**
   ```bash
   curl "https://mango-forest-0fc04f60f.1.azurestaticapps.net/staticwebapp.config.json"
   ```
   Should return the config with `auth.identityProviders.customOpenIdConnectProviders.teradyne`

## Security Notes

**Current Security Posture:**
- ✅ HTTPS enabled by default
- ✅ Azure AD authentication required
- ✅ Static content (no backend vulnerabilities)
- ✅ JSON data is read-only
- ✅ User menu validates user principal
- ✅ Session managed by Azure Static Web Apps (httpOnly cookies)

**Not Implemented (Future):**
- Content Security Policy headers
- Azure Firewall (if IP restrictions needed)
- Role-based access control (all authenticated users have same permissions)

## Files Modified

```
frontend/
├── index.html                                   # Added user-menu-container div
├── public/
│   ├── staticwebapp.config.json                 # NEW - Auth configuration
│   └── shared-components/
│       ├── user-menu.js                         # NEW - Widget
│       └── apps-manifest.json                   # NEW - App registry
└── src/
    └── styles/
        └── main.css                             # Added user menu styles

.github/workflows/
└── azure-static-web-apps-mango-forest-0fc04f60f.yml  # No changes (already correct)

DEPLOYMENT.md                                    # Updated with auth details
```

## Related Documentation

- **Skill:** `.claude/skills/azure-ad-auth/SKILL.md` (comprehensive guide)
- **AI Adoption Dashboard:** `05-shared/apps/ai-adoption-dashboard/` (reference implementation)
- **Shared Components:** `05-shared/shared-components/` (user-menu.js source)
- **Azure Docs:** https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-azure-active-directory

## Next Steps

**Immediate:**
- ✅ Authentication working
- ✅ User menu integrated
- ✅ Added to global apps manifest

**Future Enhancements:**
- [ ] Custom domain configuration (e.g., champions.lca-apps.azure)
- [ ] Data sync automation (`scripts/sync-champions.js`)
- [ ] Role-based permissions (if needed to restrict certain users)
- [ ] Usage analytics integration
- [ ] Custom error pages (401, 404, 500)

## Success Criteria

- [x] App requires Teradyne login
- [x] User info displayed in menu
- [x] Sign out works correctly
- [x] Assets load without auth (no MIME errors)
- [x] Cross-app navigation functional
- [x] GitHub repo link accessible
- [x] Azure portal link accessible
- [x] Deployment pipeline working

## Contact

**Repository:** https://github.com/mir-lca/ai-champions-tracker
**Jira Epic:** [AI-228: Champions Framework](https://teradyne-robotics.atlassian.net/browse/AI-228)
**Owner:** Lourenco Castro (lourenco.castro@teradyne.com)
