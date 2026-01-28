/**
 * TypeScript definitions for HeaderTabs component
 */

export interface Tab {
  id: string;
  label: string;
}

export interface HeaderTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function HeaderTabs(props: HeaderTabsProps): JSX.Element;
