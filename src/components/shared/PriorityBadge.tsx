import React from 'react';
import { Badge } from './Badge';
import { StatusTone } from '@/theme';

const PRIORITY_LABELS: Record<string, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
};

const PRIORITY_TONE: Record<string, StatusTone> = {
  CRITICA: 'danger',
  ALTA: 'warning',
  MEDIA: 'info',
  BAJA: 'neutral',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge label={PRIORITY_LABELS[priority] ?? priority} tone={PRIORITY_TONE[priority] ?? 'neutral'} />;
}
