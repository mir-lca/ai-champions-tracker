/**
 * TypeScript definitions for AppHeader component
 */

import { ReactNode } from 'react';
import { User, AzureResource } from './UserMenu';

export interface AppHeaderProps {
  title: string;
  metadata?: string;
  children?: ReactNode;
  user?: User | null;
  repoUrl?: string;
  azureResources?: AzureResource[];
  currentAppId: string;
}

export default function AppHeader(props: AppHeaderProps): JSX.Element;
