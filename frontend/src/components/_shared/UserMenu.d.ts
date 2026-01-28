/**
 * TypeScript definitions for UserMenu component
 */

export interface User {
  name?: string;
  email?: string;
}

export interface AzureResource {
  label: string;
  href: string;
}

export interface UserMenuProps {
  user?: User | null;
  repoUrl?: string;
  azureResources?: AzureResource[];
  currentAppId: string;
}

export default function UserMenu(props: UserMenuProps): JSX.Element;
