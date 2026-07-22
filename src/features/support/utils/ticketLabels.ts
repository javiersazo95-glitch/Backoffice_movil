import type { StatusTone } from '@/theme';
import type { TicketCategory, TicketPlatform, TicketStatus, ReporterType } from '@/api/support';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  ABIERTO: 'Abierto',
  EN_PROCESO: 'En proceso',
  PENDIENTE_VENDEDOR: 'Pendiente vendedor',
  PENDIENTE_COMPRADOR: 'Pendiente comprador',
  SLA_VENCIDO: 'SLA vencido',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
};

export const STATUS_TONE: Record<TicketStatus, StatusTone> = {
  ABIERTO: 'info',
  EN_PROCESO: 'brand',
  PENDIENTE_VENDEDOR: 'warning',
  PENDIENTE_COMPRADOR: 'warning',
  SLA_VENCIDO: 'danger',
  RESUELTO: 'success',
  CERRADO: 'neutral',
  CANCELADO: 'neutral',
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  FALLA_TECNICA: 'Falla técnica',
  SOLICITUD_AYUDA: 'Solicitud de ayuda',
  CONSULTA: 'Consulta',
};

export const REPORTER_LABELS: Record<ReporterType, string> = {
  COMPRADOR: 'Comprador',
  VENDEDOR: 'Vendedor',
  INTERNO: 'Interno',
};

export const PLATFORM_LABELS: Record<TicketPlatform, string> = {
  ADMINISTRACION_CONTABLE: 'Administración Contable',
  MEDIACION_CONFIANZA: 'Mediación y Confianza',
  APP_MOBILE: 'App Mobile RepuesTop',
  SOPORTE: 'Soporte',
  SITIO_WEB: 'Sitio Web',
};

export const SUPPORT_STATUS_OPTIONS: TicketStatus[] = [
  'ABIERTO',
  'EN_PROCESO',
  'PENDIENTE_VENDEDOR',
  'PENDIENTE_COMPRADOR',
  'SLA_VENCIDO',
  'RESUELTO',
  'CERRADO',
  'CANCELADO',
];
