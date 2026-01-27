import UserMenu from './UserMenu';

/**
 * Shared App Header Component
 *
 * Three-section layout:
 * - Left: App title + optional metadata badge
 * - Center: Flexible slot for tabs, filters, search, etc. (passed as children)
 * - Right: User menu with authentication and navigation
 *
 * @param {Object} props
 * @param {string} props.title - App title
 * @param {string} [props.metadata] - Optional metadata badge (e.g., "Data v2024-01-27")
 * @param {React.ReactNode} [props.children] - Center content (tabs, filters, etc.)
 * @param {Object} [props.user] - User object { name, email }
 * @param {string} [props.repoUrl] - GitHub repository URL
 * @param {Array} [props.azureResources] - Array of { label, href } for Azure resources
 * @param {string} props.currentAppId - ID of current app (to hide from apps list)
 */
export default function AppHeader({
  title,
  metadata,
  children,
  user,
  repoUrl,
  azureResources = [],
  currentAppId
}) {
  return (
    <header className="app-header">
      <div className="header-left-section">
        <h1 className="app-title">{title}</h1>
        {metadata && (
          <span className="header-metadata">{metadata}</span>
        )}
      </div>

      {children && (
        <div className="header-center">
          {children}
        </div>
      )}

      <UserMenu
        user={user || null}
        repoUrl={repoUrl}
        azureResources={azureResources}
        currentAppId={currentAppId}
      />
    </header>
  );
}
