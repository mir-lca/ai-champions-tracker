/**
 * Header Tabs Component
 *
 * Traditional tab navigation designed for the app header center slot.
 * Uses bottom border to indicate active state.
 *
 * @param {Object} props
 * @param {Array} props.tabs - Array of { id, label } objects
 * @param {string} props.activeTab - Currently active tab ID
 * @param {Function} props.onTabChange - Callback when tab is clicked
 */
export default function HeaderTabs({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="header-tabs" aria-label="Navigation tabs" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`header-tab ${activeTab === tab.id ? 'header-tab-active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
