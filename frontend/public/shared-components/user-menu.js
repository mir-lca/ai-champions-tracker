/**
 * Vanilla JS User Menu
 * Displays user authentication info, navigation to other apps,
 * external links (GitHub, Azure), and sign out button.
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    currentAppId: 'champions-tracker', // Filter out current app from navigation
    repoUrl: 'https://github.com/mir-lca/ai-champions-tracker',
    azureResources: [
      {
        label: 'Static Web App',
        href: 'https://portal.azure.com/#@teradyne.com/resource/subscriptions/fbc14e76-650e-4485-b7a7-ed52038aee03/resourceGroups/cursor-adoption-rg/providers/Microsoft.Web/staticSites/champions-tracker-swa-lca'
      }
    ]
  };

  class UserMenu {
    constructor(containerSelector) {
      this.container = document.querySelector(containerSelector);
      if (!this.container) {
        console.error('User menu container not found');
        return;
      }

      this.isOpen = false;
      this.apps = [];
      this.user = null;

      this.init();
    }

    async init() {
      // Fetch user info
      await this.fetchUserInfo();

      // Load apps manifest
      await this.loadApps();

      // Render menu
      this.render();

      // Set up event listeners
      this.setupEventListeners();
    }

    async fetchUserInfo() {
      try {
        // Azure Static Web Apps Easy Auth endpoint
        const response = await fetch('/.auth/me');
        const data = await response.json();

        if (data.clientPrincipal) {
          this.user = {
            name: data.clientPrincipal.userDetails || data.clientPrincipal.userId,
            email: data.clientPrincipal.userId,
            id: data.clientPrincipal.userId
          };
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    }

    async loadApps() {
      try {
        const response = await fetch('/shared-components/apps-manifest.json');
        const data = await response.json();

        // Filter out current app (if currentAppId is set)
        this.apps = CONFIG.currentAppId
          ? data.apps.filter(app => app.id !== CONFIG.currentAppId)
          : data.apps;
      } catch (error) {
        console.error('Failed to load apps manifest:', error);
      }
    }

    render() {
      const initials = this.getInitials();

      this.container.innerHTML = `
        <div class="user-menu-wrapper">
          <button
            class="user-menu-button"
            type="button"
            aria-haspopup="menu"
            aria-expanded="false"
            title="User menu"
          >
            <span class="user-avatar" aria-hidden="true">${initials}</span>
            <span class="user-menu-caret" aria-hidden="true">v</span>
          </button>

          <div class="user-menu-dropdown" role="menu">
            ${this.renderUserInfo()}
            ${this.renderAppResources()}
            ${this.renderOtherApps()}
          </div>
        </div>
      `;
    }

    renderUserInfo() {
      if (!this.user) {
        return `
          <div class="user-menu-section">
            <div class="user-menu-muted">Not signed in</div>
          </div>
        `;
      }

      const displayName = this.user.name || this.user.email || 'Guest';
      const displayEmail = this.user.email || '';

      return `
        <div class="user-menu-section">
          <div class="user-menu-name">${this.escapeHtml(displayName)}</div>
          ${displayEmail ? `<div class="user-menu-email">${this.escapeHtml(displayEmail)}</div>` : ''}
          <button class="user-menu-signout" type="button">
            Sign out
          </button>
        </div>
      `;
    }

    renderAppResources() {
      if (!CONFIG.repoUrl && CONFIG.azureResources.length === 0) {
        return '';
      }

      let html = '<div class="user-menu-section"><div class="user-menu-label">app resources</div>';

      if (CONFIG.repoUrl) {
        html += `<a class="user-menu-link" href="${CONFIG.repoUrl}" target="_blank" rel="noreferrer">GitHub repo</a>`;
      }

      CONFIG.azureResources.forEach(resource => {
        html += `<a class="user-menu-link" href="${resource.href}" target="_blank" rel="noreferrer">${this.escapeHtml(resource.label)}</a>`;
      });

      html += '</div>';
      return html;
    }

    renderOtherApps() {
      if (this.apps.length === 0) {
        return '';
      }

      let html = '<div class="user-menu-section"><div class="user-menu-label">other apps</div>';

      this.apps.forEach(app => {
        html += `<a class="user-menu-link" href="${app.url}" target="_blank" rel="noreferrer">${this.escapeHtml(app.name)}</a>`;
      });

      html += '</div>';
      return html;
    }

    setupEventListeners() {
      const button = this.container.querySelector('.user-menu-button');
      const dropdown = this.container.querySelector('.user-menu-dropdown');
      const signOutButton = this.container.querySelector('.user-menu-signout');

      // Toggle menu
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });

      // Sign out
      if (signOutButton) {
        signOutButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleSignOut();
        });
      }

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target) && this.isOpen) {
          this.closeMenu();
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeMenu();
        }
      });
    }

    toggleMenu() {
      this.isOpen = !this.isOpen;
      this.updateMenuState();
    }

    closeMenu() {
      this.isOpen = false;
      this.updateMenuState();
    }

    updateMenuState() {
      const button = this.container.querySelector('.user-menu-button');
      const dropdown = this.container.querySelector('.user-menu-dropdown');

      if (this.isOpen) {
        button.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        dropdown.classList.add('open');
      } else {
        button.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        dropdown.classList.remove('open');
      }
    }

    handleSignOut() {
      const redirectUri = encodeURIComponent(window.location.origin);
      window.location.href = `/.auth/logout?post_logout_redirect_uri=${redirectUri}`;
    }

    getInitials() {
      if (!this.user) {
        return 'U';
      }

      const source = this.user.name || this.user.email || 'Guest';
      const parts = source.split(/[\s@._-]+/).filter(Boolean);
      const initials = parts
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('');

      return initials || 'U';
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new UserMenu('#user-menu-container');
    });
  } else {
    new UserMenu('#user-menu-container');
  }
})();
