import React, { ReactElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/auth';
import { AccessDeniedScreen } from './AccessDeniedScreen';

export function SuperAdminGuard({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  if (user?.role !== Role.SUPER_ADMIN) {
    return <AccessDeniedScreen />;
  }
  return children;
}
