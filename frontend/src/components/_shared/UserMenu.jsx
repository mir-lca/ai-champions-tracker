import React, { useState, useEffect, useRef } from 'react';

/**
 * Shared User Menu Component
 *
 * Displays user authentication info, navigation to other apps,
 * external links (GitHub, Azure), and sign out button.
 *
 * Props:
 * - user: User object from useAuth() { name, email }
 * - repoUrl: GitHub repository URL
 * - azureResources: Array of { label, href } for Azure resources
 * - currentAppId: ID of current app (to hide from apps list)
 */
export default function UserMenu({ user, repoUrl, azureResources = [], currentAppId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [apps, setApps] = useState([]);
  const menuRef = useRef(null);

  // Load apps manifest
  useEffect(() => {
    fetch('/apps-manifest.json')
      .then(res => res.json())
      .then(data => {
        // Filter out current app
        const otherApps = data.apps.filter(app => app.id !== currentAppId);
        setApps(otherApps);
      })
      .catch(err => {
        console.error('Failed to load apps manifest:', err);
      });
  }, [currentAppId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSignOut = () => {
    const redirectUri = encodeURIComponent(window.location.origin);
    window.location.href = `/.auth/logout?post_logout_redirect_uri=${redirectUri}`;
  };

  const displayName = user?.name || user?.email || 'Guest';
  const displayEmail = user?.email || '';
  const initialsSource = user?.name || user?.email || 'Guest';
  const initials = initialsSource
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || 'U';

  return (
    <div className="header-actions" ref={menuRef}>
      <button
        className={`user-menu-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="User menu"
        type="button"
      >
        <span className="user-avatar" aria-hidden="true">{initials}</span>
        <span className="user-menu-caret" aria-hidden="true">v</span>
      </button>

      <div className={`user-menu-dropdown ${isOpen ? 'open' : ''}`} role="menu">
        {/* User Info & Auth */}
        <div className="user-menu-section">
          {user ? (
            <>
              <div className="user-menu-name">{displayName}</div>
              {displayEmail && <div className="user-menu-email">{displayEmail}</div>}
              <button className="user-menu-signout" type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <div className="user-menu-muted">Not signed in</div>
          )}
        </div>

        {/* App Resources (GitHub + Azure) */}
        {(repoUrl || azureResources.length > 0) && (
          <div className="user-menu-section">
            <div className="user-menu-label">app resources</div>
            {repoUrl && (
              <a className="user-menu-link" href={repoUrl} target="_blank" rel="noreferrer">
                GitHub repo
              </a>
            )}
            {azureResources.map((resource) => (
              <a
                key={resource.label}
                className="user-menu-link"
                href={resource.href}
                target="_blank"
                rel="noreferrer"
              >
                {resource.label}
              </a>
            ))}
          </div>
        )}

        {/* Other Apps (at bottom) */}
        {apps.length > 0 && (
          <div className="user-menu-section">
            <div className="user-menu-label">other apps</div>
            {apps.map((app) => (
              <a
                key={app.id}
                className="user-menu-link"
                href={app.url}
                target="_blank"
                rel="noreferrer"
              >
                {app.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
