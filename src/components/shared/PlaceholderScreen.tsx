import React from 'react';
import { ScreenContainer } from './ScreenContainer';
import { EmptyState } from './EmptyState';
import { Icon, IconName } from './Icon';
import { colors } from '@/theme';

interface PlaceholderScreenProps {
  title: string;
  description?: string;
  icon?: IconName;
}

/** Pantalla temporal para rutas cuya UI final se implementa en una fase posterior. */
export function PlaceholderScreen({ title, description = 'Esta sección estará disponible próximamente.', icon = 'construct-outline' }: PlaceholderScreenProps) {
  return (
    <ScreenContainer>
      <EmptyState title={title} description={description} icon={<Icon name={icon} size={40} color={colors.textTertiary} />} />
    </ScreenContainer>
  );
}
