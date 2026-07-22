import React, { ReactElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasBackofficePermission } from '@/hooks/usePermissions';
import type { BackofficeArea } from '@/types/auth';
import { AccessDeniedScreen } from './AccessDeniedScreen';

interface AreaGuardProps {
  area: BackofficeArea;
  children: ReactElement;
}

/** Defensa adicional dentro de cada navigator de área (además del filtrado en AreaSelectorScreen). */
export function AreaGuard({ area, children }: AreaGuardProps) {
  const { user } = useAuth();
  if (!hasBackofficePermission(user, area)) {
    return <AccessDeniedScreen />;
  }
  return children;
}
