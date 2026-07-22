import React from 'react';
import { Badge } from './Badge';
import { StatusTone } from '@/theme';
import { STATUS_LABELS } from '@/utils/constants';

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  APROBADO: 'success',
  APROBADA: 'success',
  VERIFICADA: 'success',
  RESUELTA: 'success',
  RESUELTO: 'success',
  POR_CORREGIR: 'warning',
  PENDIENTE: 'warning',
  PENDIENTE_VENDEDOR: 'warning',
  PENDIENTE_COMPRADOR: 'warning',
  SLA_VENCIDO: 'danger',
  RECHAZADO: 'danger',
  RECHAZADA: 'danger',
  BLOQUEADA: 'danger',
  CANCELADO: 'danger',
  ESPERANDO_VENDEDOR: 'warning',
  ESCALADO: 'danger',
  EN_MEDIACION: 'violet',
  EN_PROCESO: 'info',
  ABIERTO: 'info',
  CERRADA: 'neutral',
  CERRADO: 'neutral',
};

interface StatusBadgeProps {
  status: string;
  toneOverride?: StatusTone;
}

/** Traduce un estado crudo del backend (ej. EN_MEDIACION) a badge con label en español. */
export function StatusBadge({ status, toneOverride }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status;
  const tone = toneOverride ?? STATUS_TONE_MAP[status] ?? 'neutral';
  return <Badge label={label} tone={tone} />;
}
